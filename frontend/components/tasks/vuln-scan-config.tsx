{/* Vulnerability Scan配置 */ }
{
    formData.taskType === "vuln_scan" && (
        <div className="space-y-4">
            {/* 数据源说明 */}
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-medium">💡 漏洞扫描说明</p>
                <p className="mt-1 text-xs">
                    基于Nmap扫描结果识别服务，然后查询NVD CVE数据库查找已知漏洞
                </p>
            </div>

            {/* Nmap扫描结果选择 */}
            <div className="space-y-2">
                <Label htmlFor="vulnScanResultId">选择Nmap扫描任务 *</Label>
                <Select
                    value={formData.vulnScanResultId || ''}
                    onValueChange={(value) => setFormData({ ...formData, vulnScanResultId: value })}
                >
                    <SelectTrigger id="vulnScanResultId">
                        <SelectValue placeholder="选择一个已完成的Nmap扫描" />
                    </SelectTrigger>
                    <SelectContent>
                        {/* 这里会动态加载已完成的Nmap扫描任务 */}
                        <SelectItem value="demo">演示: Nmap扫描 - 192.168.1.1</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    从Nmap扫描结果中提取服务信息进行漏洞检测
                </p>
            </div>

            {/* 严重程度过滤 */}
            <div className="space-y-3">
                <Label>严重程度过滤</Label>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="severityCritical"
                            checked={formData.severityFilter?.includes('CRITICAL')}
                            onChange={(e) => {
                                const newFilter = e.target.checked
                                    ? [...formData.severityFilter, 'CRITICAL']
                                    : formData.severityFilter.filter(s => s !== 'CRITICAL')
                                setFormData({ ...formData, severityFilter: newFilter })
                            }}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="severityCritical" className="font-normal cursor-pointer">
                            🔴 严重 (CVSS ≥ 9.0)
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="severityHigh"
                            checked={formData.severityFilter?.includes('HIGH')}
                            onChange={(e) => {
                                const newFilter = e.target.checked
                                    ? [...formData.severityFilter, 'HIGH']
                                    : formData.severityFilter.filter(s => s !== 'HIGH')
                                setFormData({ ...formData, severityFilter: newFilter })
                            }}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="severityHigh" className="font-normal cursor-pointer">
                            🟠 高危 (CVSS 7.0-8.9)
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="severityMedium"
                            checked={formData.severityFilter?.includes('MEDIUM')}
                            onChange={(e) => {
                                const newFilter = e.target.checked
                                    ? [...formData.severityFilter, 'MEDIUM']
                                    : formData.severityFilter.filter(s => s !== 'MEDIUM')
                                setFormData({ ...formData, severityFilter: newFilter })
                            }}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="severityMedium" className="font-normal cursor-pointer">
                            🟡 中危 (CVSS 4.0-6.9)
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="severityLow"
                            checked={formData.severityFilter?.includes('LOW')}
                            onChange={(e) => {
                                const newFilter = e.target.checked
                                    ? [...formData.severityFilter, 'LOW']
                                    : formData.severityFilter.filter(s => s !== 'LOW')
                                setFormData({ ...formData, severityFilter: newFilter })
                            }}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="severityLow" className="font-normal cursor-pointer">
                            🟢 低危 (CVSS 0.1-3.9)
                        </Label>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    只显示选中严重程度的漏洞
                </p>
            </div>

            {/* NVD API密钥 (可选) */}
            <div className="space-y-2">
                <Label htmlFor="nvdApiKey">NVD API密钥 (可选)</Label>
                <Input
                    id="nvdApiKey"
                    type="password"
                    placeholder="提供API密钥可提高速率限制"
                    value={formData.nvdApiKey || ''}
                    onChange={(e) => setFormData({ ...formData, nvdApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                    无密钥: 5请求/30秒 | 有密钥: 50请求/30秒
                </p>
            </div>
        </div>
    )
}
