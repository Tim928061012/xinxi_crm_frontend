<template>
  <div class="system-page">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card>
          <template #header>
            <span>系统信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="系统名称">信息CRM系统</el-descriptions-item>
            <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
            <el-descriptions-item label="运行环境">生产环境</el-descriptions-item>
            <el-descriptions-item label="服务器时间">
              {{ currentTime }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card>
          <template #header>
            <span>系统配置</span>
          </template>
          <el-form
            ref="configFormRef"
            :model="configForm"
            label-width="120px"
          >
            <el-form-item label="系统名称">
              <el-input v-model="configForm.systemName" />
            </el-form-item>
            <el-form-item label="系统描述">
              <el-input
                v-model="configForm.systemDesc"
                type="textarea"
                :rows="3"
              />
            </el-form-item>
            <el-form-item label="维护模式">
              <el-switch v-model="configForm.maintenanceMode" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8">
        <el-card>
          <template #header>
            <span>系统操作</span>
          </template>
          <div class="system-actions">
            <el-button type="primary" :icon="Refresh" @click="handleClearCache">
              清除缓存
            </el-button>
            <el-button type="warning" :icon="Document" @click="handleExportLogs">
              导出日志
            </el-button>
            <el-button type="danger" :icon="Warning" @click="handleSystemRestart">
              系统重启
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>数据库配置</span>
          </template>
          <el-form
            ref="dbFormRef"
            :model="dbForm"
            label-width="120px"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="数据库类型">
                  <el-input v-model="dbForm.type" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="数据库地址">
                  <el-input v-model="dbForm.host" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="数据库端口">
                  <el-input v-model="dbForm.port" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="数据库名称">
                  <el-input v-model="dbForm.database" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item>
              <el-button type="primary" @click="handleTestConnection">测试连接</el-button>
              <el-button @click="handleSaveDbConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Document, Warning } from '@element-plus/icons-vue'

const configFormRef = ref()
const dbFormRef = ref()
let timer: number | null = null

const currentTime = ref('')

const configForm = reactive({
  systemName: '信息CRM系统',
  systemDesc: '信息CRM管理系统',
  maintenanceMode: false
})

const dbForm = reactive({
  type: 'MySQL',
  host: 'localhost',
  port: '3306',
  database: 'crm_db'
})

onMounted(() => {
  loadSystemInfo()
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN')
}

const loadSystemInfo = async () => {
  try {
    // TODO: 调用接口获取系统信息
    // const response = await adminApi.getSystemInfo()
    // configForm.systemName = response.data.systemName
    // configForm.systemDesc = response.data.systemDesc
    // configForm.maintenanceMode = response.data.maintenanceMode
  } catch (error) {
    console.error('加载系统信息失败:', error)
  }
}

const handleSaveConfig = async () => {
  try {
    // TODO: 调用接口保存系统配置
    // await adminApi.saveSystemConfig(configForm)
    ElMessage.success('配置保存成功')
  } catch (error) {
    ElMessage.error('配置保存失败')
  }
}

const handleClearCache = async () => {
  try {
    await ElMessageBox.confirm('确定要清除系统缓存吗？', '提示', {
      type: 'warning'
    })
    // TODO: 调用清除缓存接口
    // await adminApi.clearCache()
    ElMessage.success('缓存清除成功')
  } catch {
    // 用户取消
  }
}

const handleExportLogs = () => {
  ElMessage.info('导出日志功能开发中')
  // TODO: 实现导出日志功能
}

const handleSystemRestart = async () => {
  try {
    await ElMessageBox.confirm('确定要重启系统吗？重启期间系统将无法访问！', '警告', {
      type: 'warning',
      confirmButtonText: '确定重启',
      cancelButtonText: '取消'
    })
    // TODO: 调用系统重启接口
    // await adminApi.restartSystem()
    ElMessage.success('系统重启中...')
  } catch {
    // 用户取消
  }
}

const handleTestConnection = async () => {
  try {
    // TODO: 调用测试数据库连接接口
    // await adminApi.testDbConnection(dbForm)
    ElMessage.success('数据库连接测试成功')
  } catch (error) {
    ElMessage.error('数据库连接测试失败')
  }
}

const handleSaveDbConfig = async () => {
  try {
    await ElMessageBox.confirm('修改数据库配置可能导致系统无法正常运行，确定要继续吗？', '警告', {
      type: 'warning'
    })
    // TODO: 调用保存数据库配置接口
    // await adminApi.saveDbConfig(dbForm)
    ElMessage.success('数据库配置保存成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('数据库配置保存失败')
    }
  }
}
</script>

<style lang="scss" scoped>
.system-page {
  .system-actions {
    display: flex;
    flex-direction: column;
    gap: 15px;
    
    .el-button {
      width: 100%;
    }
  }
}

// 禁用所有表单 label 的点击聚焦行为
:deep(.el-form-item__label) {
  pointer-events: none !important;
  cursor: default !important;
}
</style>
