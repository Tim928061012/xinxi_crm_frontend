# 部署指南

## 跨域问题解决方案

本项目已经配置了跨域问题的解决方案，适用于开发环境和生产环境。

### 开发环境

开发环境使用 **Vite 代理** 解决跨域问题：

- 所有 `/api` 请求会被自动代理到 `http://localhost:8080`
- 配置位置：`vite.config.ts`
- 无需额外配置，启动开发服务器即可使用

### 生产环境

生产环境推荐使用 **Nginx 反向代理** 解决跨域问题：

#### 方案一：Nginx 反向代理（推荐）

1. **构建前端项目**
   ```bash
   npm run build
   ```
   构建产物在 `dist` 目录

2. **部署到服务器**
   ```bash
   # 将 dist 目录上传到服务器
   scp -r dist/* user@your-server:/var/www/xinxi-crm/
   ```

3. **配置 Nginx**
   - 复制 `nginx.conf` 文件到服务器
   - 修改配置文件中的路径和域名
   - 创建软链接并重启 Nginx
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/xinxi-crm
   sudo ln -s /etc/nginx/sites-available/xinxi-crm /etc/nginx/sites-enabled/
   sudo nginx -t  # 测试配置
   sudo systemctl restart nginx
   ```

4. **Nginx 配置说明**
   - 前端静态文件：直接由 Nginx 提供
   - API 请求：`/api/*` 路径会被代理到后端服务器 `http://localhost:8080`
   - 这样前端和后端在同一个域名下，不会产生跨域问题

#### 方案二：后端配置 CORS（备选）

如果不想使用 Nginx 代理，也可以在后端配置 CORS：

**Spring Boot 示例：**
```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("http://your-frontend-domain.com")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

**Node.js/Express 示例：**
```javascript
const cors = require('cors');
app.use(cors({
    origin: 'http://your-frontend-domain.com',
    credentials: true
}));
```

## 环境变量配置

### 开发环境
`.env.development` 文件（已配置）：
```
VITE_API_BASE_URL=http://localhost:8080
```
注意：开发环境实际使用 Vite 代理，此配置主要用于参考。

### 生产环境
`.env.production` 文件（可选）：
```
# 如果使用 Nginx 代理，可以留空或使用相对路径
VITE_API_BASE_URL=/api

# 如果不使用 Nginx 代理，需要配置完整的后端地址
# VITE_API_BASE_URL=https://api.your-domain.com
```

## 部署步骤

### 1. 构建项目
```bash
cd frontend
npm install
npm run build
```

### 2. 部署到 Linux 服务器

#### 使用 Nginx（推荐）
```bash
# 1. 上传构建产物
scp -r dist/* user@server:/var/www/xinxi-crm/

# 2. 配置 Nginx（参考上面的 Nginx 配置）

# 3. 重启 Nginx
sudo systemctl restart nginx
```

#### 使用 PM2（Node.js 服务器）
```bash
# 1. 安装 PM2
npm install -g pm2

# 2. 使用 PM2 启动预览服务器
pm2 serve dist 3000 --spa --name xinxi-crm

# 3. 配置 Nginx 反向代理（仍然需要）
```

## 验证部署

1. 访问前端地址：`http://your-domain.com`
2. 测试登录功能
3. 检查浏览器控制台，确认没有跨域错误
4. 检查网络请求，确认 API 请求正常

## 常见问题

### Q: 开发环境仍然有跨域问题？
A: 确保：
- Vite 开发服务器已重启
- 后端服务运行在 `http://localhost:8080`
- 检查浏览器控制台的错误信息

### Q: 生产环境有跨域问题？
A: 检查：
- Nginx 配置是否正确
- 后端服务是否正常运行
- Nginx 错误日志：`sudo tail -f /var/log/nginx/error.log`

### Q: 如何修改后端地址？
A: 
- 开发环境：修改 `vite.config.ts` 中的 `proxy.target`
- 生产环境：修改 `nginx.conf` 中的 `proxy_pass` 地址

## 安全建议

1. **使用 HTTPS**：生产环境强烈建议配置 SSL 证书
2. **配置防火墙**：只开放必要的端口（80, 443）
3. **定期更新**：保持 Nginx 和系统更新
4. **日志监控**：定期检查 Nginx 访问日志和错误日志
