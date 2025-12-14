<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6" v-for="stat in stats" :key="stat.title">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="30">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :sm="24" :md="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>任务统计</span>
            </div>
          </template>
          <div class="chart-container">
            <!-- TODO: 集成图表库，如 ECharts -->
            <div class="chart-placeholder">
              <p>图表区域（待集成图表库）</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近活动</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.time"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :xs="12" :sm="8" :md="6" v-for="action in quickActions" :key="action.title">
              <div class="quick-action" @click="handleQuickAction(action)">
                <el-icon :size="40" :color="action.color">
                  <component :is="action.icon" />
                </el-icon>
                <div class="action-title">{{ action.title }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  List,
  Loading,
  CircleCheck,
  Document,
  Plus,
  Setting
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

const stats = ref([
  {
    title: '总任务数',
    value: '0',
    icon: List,
    color: '#025189'
  },
  {
    title: '进行中',
    value: '0',
    icon: Loading,
    color: '#67c23a'
  },
  {
    title: '已完成',
    value: '0',
    icon: CircleCheck,
    color: '#e6a23c'
  },
  {
    title: '数据总量',
    value: '0',
    icon: Document,
    color: '#f56c6c'
  }
])

const recentActivities = ref([
  { content: '创建了新任务', time: '2024-01-15 10:30' },
  { content: '更新了数据', time: '2024-01-15 09:20' },
  { content: '完成了任务', time: '2024-01-14 16:45' }
])

const quickActions = ref([
  { title: '新建任务', icon: Plus, color: '#025189', route: '/tasks' },
  { title: '数据管理', icon: Document, color: '#67c23a', route: '/data' },
  { title: '个人设置', icon: Setting, color: '#e6a23c', route: '/profile' }
])

onMounted(() => {
  // TODO: 加载统计数据
  loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    // TODO: 调用接口获取统计数据
    // const response = await dashboardApi.getStats()
    // stats.value = response.data
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  }
}

const handleQuickAction = (action: any) => {
  if (action.route) {
    router.push(action.route)
  } else {
    ElMessage.info(`功能开发中: ${action.title}`)
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-card {
    margin-bottom: 20px;
    
    .stat-content {
      display: flex;
      align-items: center;
      
      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        margin-right: 15px;
      }
      
      .stat-info {
        flex: 1;
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 5px;
        }
        
        .stat-title {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }
  
  .card-header {
    font-weight: bold;
    font-size: 16px;
  }
  
  .chart-container {
    height: 300px;
    
    .chart-placeholder {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      border-radius: 4px;
      color: #909399;
    }
  }
  
  .quick-action {
    text-align: center;
    padding: 20px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s;
    border: 1px solid #e4e7ed;
    
    &:hover {
      background-color: #f5f7fa;
      border-color: #025189;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(2, 81, 137, 0.2);
    }
    
    .action-title {
      margin-top: 10px;
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>
