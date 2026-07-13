package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type GeoInfo struct {
	CountryName string `json:"country_name"`
}

type CacheEntry struct {
	Country string
	Expiry  time.Time
}

type RateLimiter struct {
	mu     sync.Mutex
	tokens int
	last   time.Time
}

type DebugRedirectResponse struct {
	IP           string            `json:"ip"`
	Country      string            `json:"country"`
	CountryMeta  CountryMeta       `json:"country_meta"`
	Slug         string            `json:"slug"`
	Link         string            `json:"link"`
	Target       string            `json:"target"`
	Rule         string            `json:"rule"`
	Method       string            `json:"method"`
	Path         string            `json:"path"`
	Query        string            `json:"query"`
	RemoteAddr   string            `json:"remote_addr"`
	Headers      map[string]string `json:"headers"`
	ServerTime   string            `json:"server_time"`
	RateLimited  bool              `json:"rate_limited"`
	WouldRedirect bool             `json:"would_redirect"`
}

type CountryMeta struct {
	CacheHit       bool   `json:"cache_hit"`
	FromAngolaIP   bool   `json:"from_angola_ip"`
	Source         string `json:"source"` // cache | angola-range | ipapi | unknown
	IpapiHTTPCode  int    `json:"ipapi_http_code,omitempty"`
	IpapiError     string `json:"ipapi_error,omitempty"`
}

var (
	cache     sync.Map
	limiters  sync.Map
	cacheTTL  = 10 * time.Minute
	maxTokens = 10
	resetTime = time.Minute
)

// =============================
// ENTRY POINT
// =============================
func main() {
	http.HandleFunc("/redirect/", redirectHandler)
	http.HandleFunc("/redirect-debug/", debugRedirectHandler)

	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	fmt.Println("porta 9003...")
	log.Fatal(http.ListenAndServe(":9003", nil))
}

// =============================
// HANDLER PRINCIPAL
// =============================
func redirectHandler(w http.ResponseWriter, r *http.Request) {
	ip := getRealIP(r)

	if !allowRequest(ip) {
		http.Error(w, "429 Too Many Requests", http.StatusTooManyRequests)
		return
	}

	slug := strings.TrimPrefix(r.URL.Path, "/redirect/")
	link := r.URL.Query().Get("link")
	if link == "" {
		http.Error(w, "link query param obrigatório", http.StatusBadRequest)
		return
	}

	country := resolveCountry(ip)
	if strings.EqualFold(country, "Angola") {
		target := fmt.Sprintf("https://checkout.academiatreesix.com/%s", slug)
		http.Redirect(w, r, target, http.StatusTemporaryRedirect)
		return
	}

	target := fmt.Sprintf("https://www.academiatreesix.com/%s", strings.TrimPrefix(link, "/"))
	http.Redirect(w, r, target, http.StatusTemporaryRedirect)
}

// =============================
// DEBUG HANDLER (NÃO REDIRECIONA)
// =============================
func debugRedirectHandler(w http.ResponseWriter, r *http.Request) {
	ip := getRealIP(r)

	rateLimited := false
	if !allowRequest(ip) {
		rateLimited = true
	}

	slug := strings.TrimPrefix(r.URL.Path, "/redirect-debug/")
	link := r.URL.Query().Get("link")

	country, meta := resolveCountryWithMeta(ip)

	target := ""
	rule := ""
	if link == "" {
		rule = "missing_link_param"
	} else if strings.EqualFold(country, "Angola") {
		rule = "angola -> checkout"
		target = fmt.Sprintf("https://checkout.academiatreesix.com/%s", slug)
	} else {
		rule = "non-angola -> www"
		target = fmt.Sprintf("https://www.academiatreesix.com/%s", strings.TrimPrefix(link, "/"))
	}

	headers := map[string]string{
		"CF-Connecting-IP":  r.Header.Get("CF-Connecting-IP"),
		"X-Real-IP":         r.Header.Get("X-Real-IP"),
		"X-Forwarded-For":   r.Header.Get("X-Forwarded-For"),
		"CF-IPCountry":      r.Header.Get("CF-IPCountry"),
		"User-Agent":        r.Header.Get("User-Agent"),
		"RemoteAddr":        r.RemoteAddr,
	}

	resp := DebugRedirectResponse{
		IP:            ip,
		Country:       country,
		CountryMeta:   meta,
		Slug:          slug,
		Link:          link,
		Target:        target,
		Rule:          rule,
		Method:        r.Method,
		Path:          r.URL.Path,
		Query:         r.URL.RawQuery,
		RemoteAddr:    r.RemoteAddr,
		Headers:       headers,
		ServerTime:    time.Now().Format(time.RFC3339),
		RateLimited:   rateLimited,
		WouldRedirect: (link != "" && target != ""),
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)

	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	_ = enc.Encode(resp)
}

// =============================
// COUNTRY RESOLUTION + CACHE
// =============================
func resolveCountry(ip string) string {
	c, _ := resolveCountryWithMeta(ip)
	return c
}

func resolveCountryWithMeta(ip string) (string, CountryMeta) {
	if val, ok := cache.Load(ip); ok {
		entry := val.(CacheEntry)
		if time.Now().Before(entry.Expiry) {
			return entry.Country, CountryMeta{
				CacheHit:     true,
				FromAngolaIP: strings.EqualFold(entry.Country, "Angola"),
				Source:       "cache",
			}
		}
		cache.Delete(ip)
	}

	if IsAngolaIP(ip) {
		cache.Store(ip, CacheEntry{"Angola", time.Now().Add(cacheTTL)})
		return "Angola", CountryMeta{
			CacheHit:     false,
			FromAngolaIP: true,
			Source:       "angola-range",
		}
	}

	country, httpCode, errStr := getCountryWithMeta(ip)
	if country == "" {
		country = "Unknown"
	}

	cache.Store(ip, CacheEntry{country, time.Now().Add(cacheTTL)})
	meta := CountryMeta{
		CacheHit:     false,
		FromAngolaIP: strings.EqualFold(country, "Angola"),
		Source:       "ipapi",
		IpapiHTTPCode: httpCode,
	}
	if country == "Unknown" && errStr != "" {
		meta.Source = "unknown"
		meta.IpapiError = errStr
	}
	if errStr != "" && meta.IpapiError == "" {
		meta.IpapiError = errStr
	}
	return country, meta
}

// =============================
// RATE LIMIT
// =============================
func allowRequest(ip string) bool {
	val, _ := limiters.LoadOrStore(ip, &RateLimiter{
		tokens: maxTokens,
		last:   time.Now(),
	})
	rl := val.(*RateLimiter)
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	if now.Sub(rl.last) >= resetTime {
		rl.tokens = maxTokens
		rl.last = now
	}
	if rl.tokens > 0 {
		rl.tokens--
		return true
	}
	return false
}

// =============================
// GEO Fallback via ipapi.co
// =============================
func getCountryWithMeta(ip string) (country string, httpCode int, errStr string) {
	client := &http.Client{Timeout: 1 * time.Second}
	url := fmt.Sprintf("https://ipapi.co/%s/json/", ip)

	resp, err := client.Get(url)
	if err != nil {
		return "Unknown", 0, err.Error()
	}
	defer resp.Body.Close()

	httpCode = resp.StatusCode
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "Unknown", resp.StatusCode, fmt.Sprintf("ipapi non-2xx: %d", resp.StatusCode)
	}

	var data GeoInfo
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "Unknown", resp.StatusCode, err.Error()
	}

	if strings.TrimSpace(data.CountryName) == "" {
		return "Unknown", resp.StatusCode, "empty country_name"
	}

	return data.CountryName, resp.StatusCode, ""
}

// =============================
// IP HELPERS
// =============================
func getRealIP(r *http.Request) string {
	headers := []string{"CF-Connecting-IP", "X-Real-IP", "X-Forwarded-For"}
	for _, h := range headers {
		if ip := r.Header.Get(h); ip != "" {
			return strings.TrimSpace(strings.Split(ip, ",")[0])
		}
	}
	host, _, _ := net.SplitHostPort(r.RemoteAddr)
	return host
}
