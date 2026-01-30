# 信息CRM系统 - 前端项目

基于 Vue 3 + TypeScript + Element Plus 构建的现代化CRM管理系统前端应用。

## 功能特性

### 用户认证
- ✅ 普通用户登录/登出
- ✅ 超级管理员登录/登出
- ✅ 基于角色的权限控制
- ✅ 路由守卫保护

### 普通用户功能
- ✅ 仪表盘（数据统计、快速操作）
- ✅ 任务管理（创建、启动、停止、删除任务）
- ✅ 数据管理（查看、编辑、删除、导入导出数据）
- ✅ 个人中心（个人信息管理、密码修改）

### 超级管理员功能
- ✅ 用户管理（创建、编辑、删除、启用/禁用用户）
- ✅ 系统设置（系统配置、数据库配置、系统操作）
- ✅ 操作日志（查看系统操作日志详情）

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript超集
- **Vite** - 下一代前端构建工具
- **Vue Router** - 官方路由管理器
- **Pinia** - Vue的状态管理库
- **Element Plus** - 基于Vue 3的组件库
- **Axios** - HTTP客户端
- **NProgress** - 页面加载进度条

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API接口定义
│   │   ├── auth.ts       # 认证相关接口
│   │   ├── task.ts       # 任务相关接口
│   │   ├── data.ts       # 数据相关接口
│   │   ├── user.ts       # 用户相关接口
│   │   ├── admin.ts      # 管理员相关接口
│   │   ├── dashboard.ts  # 仪表盘相关接口
│   │   └── request.ts    # Axios请求封装
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── layouts/          # 布局组件
│   │   └── MainLayout.vue
│   ├── router/           # 路由配置
│   │   └── index.ts
│   ├── stores/           # Pinia状态管理
│   │   └── auth.ts       # 认证状态
│   ├── styles/           # 全局样式
│   │   └── index.scss
│   ├── types/            # TypeScript类型定义
│   │   └── auth.ts
│   ├── views/            # 页面组件
│   │   ├── Login.vue     # 登录页
│   │   ├── Dashboard.vue # 仪表盘
│   │   ├── NotFound.vue  # 404页面
│   │   ├── user/         # 普通用户页面
│   │   │   ├── Tasks.vue
│   │   │   ├── Data.vue
│   │   │   └── Profile.vue
│   │   └── admin/        # 管理员页面
│   │       ├── Users.vue
│   │       ├── System.vue
│   │       └── Logs.vue
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 开始使用

### 安装依赖

```bash
cd frontend
npm install
```

### 开发环境运行

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录

### 预览生产构建

```bash
npm run preview
```

## 环境配置

### 开发环境
编辑 `.env.development` 文件配置开发环境的API地址：

```
VITE_API_BASE_URL=http://localhost:8080
```

### 生产环境
编辑 `.env.production` 文件配置生产环境的API地址：

```
VITE_API_BASE_URL=/api
```

## 登录账号

### 普通用户
- 用户名: `user`
- 密码: `123456`

### 超级管理员
- 用户名: `admin`
- 密码: `123456`

> 注意：当前为模拟登录，实际接口对接后需要替换为真实的登录逻辑。

## 路由说明

### 公开路由
- `/login` - 登录页面

### 需要认证的路由
- `/dashboard` - 仪表盘（所有用户）
- `/tasks` - 任务管理（所有用户）
- `/data` - 数据管理（所有用户）
- `/profile` - 个人中心（所有用户）

### 仅管理员路由
- `/admin/users` - 用户管理
- `/admin/system` - 系统设置
- `/admin/logs` - 操作日志

## API接口对接

所有API接口定义在 `src/api/` 目录下，目前为占位实现。需要对接实际后端接口时，请：

1. 修改对应的API文件中的接口地址
2. 根据后端返回的数据格式调整响应处理
3. 在 `src/api/request.ts` 中配置请求拦截器和响应拦截器

### 接口文件说明

- `auth.ts` - 登录、登出、获取用户信息
- `task.ts` - 任务CRUD、启动、停止
- `data.ts` - 数据CRUD、导入导出
- `user.ts` - 个人信息、修改密码
- `admin.ts` - 用户管理、系统设置、日志查询
- `dashboard.ts` - 统计数据、图表数据

## 权限控制

系统使用基于角色的访问控制（RBAC）：

1. **路由级别权限**：在路由配置中通过 `meta.roles` 指定可访问的角色
2. **菜单级别权限**：在布局组件中根据用户角色动态显示菜单
3. **按钮级别权限**：在页面组件中根据用户角色控制按钮显示

## 开发规范

1. 使用 TypeScript 进行类型约束
2. 遵循 Vue 3 Composition API 规范
3. 使用 Element Plus 组件库
4. API 调用统一使用 `src/api/request.ts` 封装的 axios 实例
5. 状态管理使用 Pinia
6. 样式使用 SCSS

## 注意事项

1. 所有接口调用目前为模拟实现，需要对接实际后端接口
2. 登录功能目前使用 localStorage 模拟，实际应使用后端返回的 token
3. 图表功能需要集成 ECharts 或其他图表库
4. 文件上传/下载功能需要根据实际需求实现

## 后续开发建议

1. 集成 ECharts 实现数据可视化
2. 添加国际化支持（i18n）
3. 添加主题切换功能
4. 完善错误处理和异常提示
5. 添加单元测试和E2E测试
6. 优化打包体积和性能
7. 添加 PWA 支持

## 许可证

MIT
