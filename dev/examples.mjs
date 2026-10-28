export const examples = [
	{
		name: "quick",
		source: `业务决定 → 持久化 → 交给执行方 → 执行 → 记录结果`,
	},
	{
		name: "labels",
		source: `业务决定 → 持久化 → 交给执行方 → 执行 → 记录结果
① 写库前崩溃：意图丢失
② outbox 至少一次投递，会重复
③ lease 过期被别人再拿走
④ 执行成功但回写失败`,
	},
	{
		name: "details",
		source: `业务决定
  生成 \`task_id\`
→ 写库前崩溃：意图丢失
持久化
  \`tasks\` + \`outbox\` 同事务
→ 至少一次投递，会重复
交给执行方
  relay 推到队列
→ lease 过期被别人拿走
执行
  下游必须幂等
→ 成功但回写失败
记录结果
  CAS 到 DONE`,
	},
];
