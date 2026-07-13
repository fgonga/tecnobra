import axios from "axios"
import { useAuthStore } from "@common/presentation/stores/auth_store.ts"
import type { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import router from "@common/presentation/router/index.ts"
import notification from "@common/application/utils/notification.ts"
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {}
class ApiService {
  public api: AxiosInstance
  constructor(url: string) {
    this.api = axios.create({
      baseURL: url,
      withCredentials: false,
    })
    this.initializeInterceptors()
  }
  private static getAuthStore() {
    return useAuthStore()
  }
  public get<T = any>(url: string, config?: any) {
    return this.api.get<T>(url, config)
  }
  public post<T = any>(url: string, data?: any, config?: any) {
    return this.api.post<T>(url, data, config)
  }
  public put<T = any>(url: string, data?: any, config?: any) {
    return this.api.put<T>(url, data, config)
  }
  public delete<T = any>(url: string, config?: any) {
    return this.api.delete<T>(url, config)
  }
  private initializeInterceptors() {
    this.api.interceptors.request.use((request: CustomAxiosRequestConfig) => {
      const token = ApiService.getAuthStore().token
      if (token) {
        request.headers = request.headers || {}
        request.headers.Authorization = `Bearer ${token}`
      }
      return request
    })
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        this.handleError(error)
        return Promise.reject(error)
      },
    )
  }
  private handleError(error: AxiosError) {
    const status = error.response?.status
    if(!error.response) {
      notification.error('Erro desconhecido');
      return;
    }
    // Erro de sessão expirada
    if (status === 401) {
      ApiService.getAuthStore().clearAuth()
      if (router.currentRoute.value.name !== 'login') {
        notification.error('Sessão expirada')
        router.push({ name: 'login' }).catch(() => {})
      }
    }
    else if (status && status >= 500) {
      return  this.serverError(error.response)
    } else if (status && status >= 400) {
      return this.clientError(error)
    }


  }
  private async clientError(error: AxiosError) {
    const status = error.response?.status
    if (status === 401) return
    if (status === 403) {
      notification.error("Acesso negado");
      return
    }
    if (error.response.data && (error.response.data as any).message) {
      notification.error((error.response.data as any).message);
      return;
    }
    notification.error("Erro no cliente");
  }
  private async serverError(response?: AxiosResponse) {

    notification.error("Erro no servidor");
  }
}

export const API = new ApiService(`${import.meta.env.VITE_API_URL}/`)
