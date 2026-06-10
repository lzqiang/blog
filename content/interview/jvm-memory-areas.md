---
title: JVM 运行时数据区面试梳理
date: 2025-03-31
category: 面试题
summary: 区分堆、虚拟机栈、方法区和程序计数器的职责与常见异常。
tags:
  - Java
---

## 堆与对象生命周期

大多数对象实例存放在堆中，由垃圾收集器管理。堆空间不足时可能出现
`OutOfMemoryError: Java heap space`。

## 栈与方法调用

每个线程拥有独立的虚拟机栈。方法调用会创建栈帧，保存局部变量、操作数栈
和返回信息。递归过深通常会触发 `StackOverflowError`。

## 方法区存放什么

方法区保存类结构、运行时常量池等元数据。HotSpot 从 Java 8 开始使用
本地内存中的 Metaspace 实现方法区。
