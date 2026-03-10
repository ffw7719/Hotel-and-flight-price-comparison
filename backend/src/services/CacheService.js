class CacheService {
  constructor(redisClient) {
    this.redisClient = redisClient;
    this.defaultTTL = parseInt(process.env.CACHE_TTL) || 3600; // 默认1小时
    this.prefix = process.env.CACHE_PREFIX || 'price-comparison';
  }

  async get(key) {
    try {
      const fullKey = `${this.prefix}:${key}`;
      const data = await this.redisClient.get(fullKey);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      const fullKey = `${this.prefix}:${key}`;
      await this.redisClient.setEx(fullKey, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      const fullKey = `${this.prefix}:${key}`;
      await this.redisClient.del(fullKey);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      const fullKey = `${this.prefix}:${key}`;
      const result = await this.redisClient.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async clearPattern(pattern) {
    try {
      const fullPattern = `${this.prefix}:${pattern}`;
      const keys = await this.redisClient.keys(fullPattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache clear pattern error:', error);
      return false;
    }
  }

  async getTTL(key) {
    try {
      const fullKey = `${this.prefix}:${key}`;
      return await this.redisClient.ttl(fullKey);
    } catch (error) {
      console.error('Cache get TTL error:', error);
      return -1;
    }
  }

  async setWithHash(key, field, value, ttl = this.defaultTTL) {
    try {
      const fullKey = `${this.prefix}:${key}`;
      await this.redisClient.hSet(fullKey, field, JSON.stringify(value));
      if (ttl > 0) {
        await this.redisClient.expire(fullKey, ttl);
      }
      return true;
    } catch (error) {
      console.error('Cache set hash error:', error);
      return false;
    }
  }

  async getFromHash(key, field) {
    try {
      const fullKey = `${this.prefix}:${key}`;
      const data = await this.redisClient.hGet(fullKey, field);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Cache get hash error:', error);
      return null;
    }
  }

  async getHash(key) {
    try {
      const fullKey = `${this.prefix}:${key}`;
      const hashData = await this.redisClient.hGetAll(fullKey);
      const result = {};
      for (const [field, value] of Object.entries(hashData)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result;
    } catch (error) {
      console.error('Cache get hash all error:', error);
      return {};
    }
  }

  async deleteHashField(key, field) {
    try {
      const fullKey = `${this.prefix}:${key}`;
      await this.redisClient.hDel(fullKey, field);
      return true;
    } catch (error) {
      console.error('Cache delete hash field error:', error);
      return false;
    }
  }

  async increment(key, increment = 1, ttl = this.defaultTTL) {
    try {
      const fullKey = `${this.prefix}:${key}`;
      const result = await this.redisClient.incrBy(fullKey, increment);
      if (ttl > 0) {
        await this.redisClient.expire(fullKey, ttl);
      }
      return result;
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  async getMultiple(keys) {
    try {
      const fullKeys = keys.map(key => `${this.prefix}:${key}`);
      const values = await this.redisClient.mGet(fullKeys);
      const result = {};
      keys.forEach((key, index) => {
        if (values[index]) {
          try {
            result[key] = JSON.parse(values[index]);
          } catch {
            result[key] = values[index];
          }
        } else {
          result[key] = null;
        }
      });
      return result;
    } catch (error) {
      console.error('Cache get multiple error:', error);
      return {};
    }
  }

  async setMultiple(keyValuePairs, ttl = this.defaultTTL) {
    try {
      const multi = this.redisClient.multi();
      for (const [key, value] of keyValuePairs) {
        const fullKey = `${this.prefix}:${key}`;
        multi.setEx(fullKey, ttl, JSON.stringify(value));
      }
      await multi.exec();
      return true;
    } catch (error) {
      console.error('Cache set multiple error:', error);
      return false;
    }
  }

  async getStats() {
    try {
      const info = await this.redisClient.info('keyspace');
      const keys = await this.redisClient.keys(`${this.prefix}:*`);
      return {
        totalKeys: keys.length,
        keySpaceInfo: info
      };
    } catch (error) {
      console.error('Cache get stats error:', error);
      return { totalKeys: 0, keySpaceInfo: '' };
    }
  }
}

module.exports = CacheService;