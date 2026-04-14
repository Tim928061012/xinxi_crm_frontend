import { formatDateTime } from '@/utils/date'

/**
 * 与 Excel 模板对应（参考 `xinxi_system/Export csv-List.csv`，即工作簿中 **Sheet2** 导出为 CSV 的结构）：
 * - **Sheet1（Export List）**：仅表头 + 数据行，`includeSpecLine: false`
 * - **Sheet2（Export Spec）**：表头 + 说明行「拼接姓名 or 公司名」+ 数据行，`includeSpecLine: true`
 *
 * Client 列含义：个人为姓名拼接，公司为公司名（与列表 normalize 一致）。
 * 使用 UTF-8 BOM + CRLF，文件末尾以 CRLF 结束，与参考 Sheet2 CSV 一致。
 */

export const CLIENT_LIST_CSV_HEADER_LINE = 'Client,Contact Nature,RM,Progress,Created Time'

/** Sheet2 说明行（与 `Export csv-List.csv` 第 2 行逐字一致） */
export const CLIENT_LIST_CSV_SPEC_LINE = '拼接姓名 or 公司名,,,,'

export interface ClientListCsvRow {
  client: string
  contactNature: string
  rm: string
  progressLabel: string
  createdTime: string
}

function escapeCsvField(value: string): string {
  const s = value ?? ''
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export interface BuildClientListCsvOptions {
  /** Sheet2 说明行（默认 false = 仅 Sheet1：表头 + 数据） */
  includeSpecLine?: boolean
}

/**
 * 生成 Client 列表导出 CSV 文本（含 BOM，行尾 CRLF）
 */
export function buildClientListCsv(rows: ClientListCsvRow[], options?: BuildClientListCsvOptions): string {
  const includeSpec = options?.includeSpecLine === true
  const lines: string[] = [CLIENT_LIST_CSV_HEADER_LINE]
  if (includeSpec) {
    lines.push(CLIENT_LIST_CSV_SPEC_LINE)
  }
  for (const row of rows) {
    const cols = [
      row.client,
      row.contactNature,
      row.rm,
      row.progressLabel,
      formatDateTime(row.createdTime)
    ]
    lines.push(cols.map(escapeCsvField).join(','))
  }
  // 与参考 Sheet2 CSV 一致：最后一行后以 CRLF 结束
  return '\uFEFF' + lines.join('\r\n') + '\r\n'
}
