export const examples = [
	{
		name: "quick",
		source: `业务决定 → 持久化 → 交给执行方 → 执行 → 记录结果
       ①        ②          ③       ④`,
	},
	{
		name: "rich",
		source: `title: 异步任务的生命周期
subtitle: 每一次交接都是一个可能丢失或重复的点

## 业务决定 | Decide
- API 校验请求，生成 \`task_id\`
- 幂等键 = \`request_id\`
tag: API
foot: 意图产生
note: 只在内存里，进程崩溃即丢失

-> 写库前崩溃 | 意图丢失：客户端必须带幂等键重试

## 持久化 | Persist
- 同一事务写 \`tasks\` + \`outbox\`
- 状态 = **PENDING**
tag: Postgres
foot: 意图落盘
note: 从这里开始不会丢

-> 交给执行方 | Outbox relay 至少一次投递，可能重复

## 交给执行方 | Dispatch
- relay 扫 outbox 推到队列
- 消费者 lease + 心跳
tag: Queue
foot: 至少一次
note: 重复投递是常态

-> 执行开始 | lease 过期后会被别人再拿走

## 执行 | Execute
- 调用下游，带幂等键
- 超时 ≠ 失败
tag: Worker
foot: 副作用发生
note: 下游必须幂等

-> 结果回写 | 执行成功但回写失败 → 重跑

## 记录结果 | Record
- CAS: \`PENDING → DONE\`
- 发事件给业务方
tag: Postgres
foot: 终态
note: 终态只写一次`,
	},
];
