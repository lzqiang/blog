---
title: Optional 不是所有空值问题的答案
date: 2026-06-10
category: Java
summary: 记录在 Java 代码中使用 Optional 时应该保留的边界感。
---

## Optional 解决的是什么

`Optional` 的价值不在于让代码看起来更“函数式”，而是把“这个值可能不存在”
这件事写进方法返回值里。调用者看到返回类型，就会知道这里必须处理缺失情况。

例如查询用户时，返回 `Optional<User>` 比返回 `null` 更明确：

```java
public Optional<User> findUserById(Long userId) {
    return userRepository.findById(userId);
}
```

这段代码表达的是：查询可能成功，也可能没有对应用户。调用者不能假装结果一定存在。

## 不要把 Optional 用成包装纸

`Optional` 不适合到处使用。它更适合作为方法返回值，而不是字段、参数或集合元素。

下面这种写法通常没有必要：

```java
public void updateUser(Optional<String> nickname) {
    nickname.ifPresent(user::setNickname);
}
```

参数位置使用 `Optional` 会让调用者承担额外包装成本，也会让接口语义变得别扭。多数情况下，
直接传普通值，并在方法内部判断是否为空，会更清晰。

## 不要急着 get

如果拿到 `Optional` 后立刻调用 `get()`，那它和直接使用 `null` 的风险没有本质区别。

```java
User user = findUserById(userId).get();
```

更好的方式是把缺失情况写清楚：

```java
User user = findUserById(userId)
    .orElseThrow(() -> new IllegalArgumentException("用户不存在：" + userId));
```

这样异常来自业务语义，而不是运行时突然抛出的 `NoSuchElementException`。

## 让返回值表达业务含义

并不是所有“查不到”都应该用 `Optional`。如果缺失本身是异常情况，可以直接抛出业务异常；
如果缺失是正常分支，`Optional` 才更合适。

我比较喜欢用这个标准判断：

- 正常允许不存在：返回 `Optional<T>`。
- 理论上必须存在：返回 `T`，不存在时抛出明确异常。
- 需要说明失败原因：返回业务结果对象，而不是只返回 `Optional<T>`。

## 小结

`Optional` 是表达“不一定有值”的工具，不是消灭所有 `null` 的魔法。真正重要的是接口语义：
调用者是否能从方法签名中看懂结果可能缺失，以及缺失时应该怎么处理。
