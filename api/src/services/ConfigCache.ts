import { Config, ConfigModel } from "../models/config.model";

// Cache em memória da linha de parametrização (id=1). Invalidado em ConfigController.setConfig (id=1).
class ConfigCache {
  private cache: Config | null = null;

  async get(): Promise<Config> {
    if (this.cache) return this.cache;
    this.cache = await ConfigModel.findOneBy("id", 1) as Config;
    return this.cache;
  }

  invalidate(): void {
    this.cache = null;
  }
}

export const configCache = new ConfigCache();
