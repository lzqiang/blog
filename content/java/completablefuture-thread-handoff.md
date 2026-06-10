---
title: CompletableFuture 里的线程切换是怎么发生的
date: 2026-06-10
category: Java
summary: 用几个常见链式调用说明任务在哪个线程继续执行，以及什么时候需要显式指定线程池。
---

## 先分清同步阶段和异步阶段

`thenApply`、`thenAccept` 这一类不带 `Async` 的方法，默认会在上一个阶段完成的线程里继续执行。
如果前一个阶段刚好由业务线程调用 `complete` 结束，那么后续逻辑也可能直接落在这个业务线程上。

这意味着链式写法看起来像是“异步流水线”，但实际执行线程未必发生切换。排查性能问题时，
先看阶段是同步延续还是异步提交，比背 API 名称更重要。

## `Async` 不等于一定安全

带 `Async` 的方法会把后续任务提交到执行器。如果没有显式传入 `Executor`，大多数情况下会落到
`ForkJoinPool.commonPool()`。这对轻量计算还可以，但一旦里面有数据库访问、RPC 或阻塞 IO，
公共线程池就容易被占满，影响系统里其他同样依赖它的任务。

因此，`Async` 解决的是“切换执行位置”，不是“自动得到合适的线程模型”。

## 为什么链路里会出现看不懂的线程名

一个典型链路可能是：

```java
CompletableFuture
    .supplyAsync(this::loadUser, ioExecutor)
    .thenApply(this::normalizeUser)
    .thenApplyAsync(this::enrichProfile, computeExecutor)
    .thenAccept(this::writeAuditLog);
```

这里第一段在 `ioExecutor` 执行；`normalizeUser` 默认沿用前一段完成时的线程；`enrichProfile`
切到 `computeExecutor`；最后的 `thenAccept` 又会继续沿用 `computeExecutor` 中完成该阶段的线程。
如果不了解这条规则，就很容易误判某一段业务为什么突然跑进了计算线程池。

## 线程池边界应该和任务类型对应

数据库、HTTP 调用、磁盘读写这类阻塞任务，应该放进独立的 IO 线程池；纯 CPU 计算可以使用更小的
固定线程池。把所有阶段都丢给同一个执行器，代码虽然简洁，但会让慢 IO 和计算任务相互拖累。

更稳妥的做法是先画出阶段边界，再按任务类型决定在哪一步切池，而不是见到 `Async` 就统一套用。

## 面试和排障时可以这样回答

如果被问到 “`thenApply` 和 `thenApplyAsync` 的区别”，不要只答“一个同步一个异步”。
更完整的说法是：

1. 不带 `Async` 的阶段默认由前一阶段完成它的线程继续执行。
2. 带 `Async` 的阶段会提交到执行器；不传执行器时通常走公共线程池。
3. 是否需要切线程，取决于当前阶段是否有阻塞操作、是否希望隔离资源，以及链路上的吞吐目标。

把这三点讲清楚，通常比单纯背定义更能体现工程理解。
