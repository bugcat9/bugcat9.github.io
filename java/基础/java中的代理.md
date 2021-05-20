# java中的代理

## 简介

在学习spring的时候学习到了代理相关的知识，所以记录一下。**代理的作用是帮助业务更加简单专一，而一些公共的东西交给代理来完成**。比如：我们写`Service`的时候，需要在里面编写增删改查四个方法，并且调用这四个方法的时候都需要给出日志，这个时候我们就可以使用代理来完成，让`Service`中只专注于增删改查，而代理关注于写然日志。java的代理有静态和动态两种，一般使用动态更好。

## 代理讲解

### 提出问题

假设我们有一个需求，需要编写一个`UserService`，里面要有增删改查四个函数，在调用`UserService`的时候我们需要完成日志的输入。

一般情况下我们是这样实现的，先编写一个`UserService`的接口：

```java
/**
 * @author zhouning
 */
public interface UserService {
    public void add();
    public void update();
    public void delete();
    public void search();
}
```

然后再实现这个接口，并且在实现里面写一下日志：

```java
/**
 * @author zhouning
 */
public class UserServiceImpl implements UserService {
    @Override
    public void add() {
        log("add");
        System.out.println("增加用户");
    }

    @Override
    public void update() {
        log("update");
        System.out.println("更新用户");
    }

    @Override
    public void delete() {
        log("delete");
        System.out.println("删除用户");
    }

    @Override
    public void search() {
        log("search");
        System.out.println("查询用户");
    }

    /**
     * 日志
     * @param methodName
     */
    public void log(String methodName){
        System.out.println("调用了"+methodName+"方法");
    }
}
```

但是这样似乎有一些不好，因为`UserService`应该专注于增删改查的业务，这种日志方法写在里面，就有一种不纯粹的感觉，所以这个时候我们引入了代理，使用代理来帮助我处理日志问题。

### 静态代理

更改`UserServiceImpl`中代码：

```java
/**
 * @author zhouning
 */
public class UserServiceImpl implements UserService {
    @Override
    public void add() {
        System.out.println("增加用户");
    }

    @Override
    public void update() {
        System.out.println("更新用户");
    }

    @Override
    public void delete() {
        System.out.println("删除用户");
    }

    @Override
    public void search() {
        System.out.println("查询用户");
    }
}

```

创建对应的代理类`UserServiceProxy`：

```java
/**
 * @author zhouning
 */
public class UserServiceProxy implements UserService {

    UserService userService;
    @Override
    public void add() {
        log("add");
        userService.add();
    }

    @Override
    public void update() {
        log("update");
        userService.update();
    }

    @Override
    public void delete() {
        log("delete");
        userService.delete();
    }

    @Override
    public void search() {
        log("search");
        userService.search();
    }

    /**
     * 日志
     * @param methodName
     */
    public void log(String methodName){
        System.out.println("调用了"+methodName+"方法");
    }
}
```

​		这样我们在实现`UserService`时，我们只需要关注业务的部分。但是我们发现这样的静态代理，有一个缺点，那就是类变多了增加了工作量，并且如果又有另外一个`service`有类似的需求，又需要创建另外一个`service`相关的接口，再实现另外一个代理类，比较麻烦，所以也就有了我们的动态代理类。

### 动态代理

这里讲的动态代理是基于jdk动态代理实习，相关的内容为`InvocationHandler`接口和`Proxy`类。

* `InvocationHandler`，官方文档说明上介绍：“`InvocationHandler` is the interface implemented by the *invocation handler* of a proxy instance.

  Each proxy instance has an associated invocation handler. When a method is invoked on a proxy instance, the method invocation is encoded and dispatched to the `invoke` method of its invocation handler.”（翻译：InvocationHandler是由代理实例的调用处理程序实现的接口。 每个代理实例都有一个关联的调用处理程序。在代理实例上调用方法时，该方法调用将被编码并分派到其调用处理程序的invoke方法。）

  `InvocationHandler` 里面有一个方法：

  ```java
  Object	invoke(Object proxy, Method method, Object[] args)
  //Processes a method invocation on a proxy instance and returns the result.处理代理实例上的方法调用并返回结果
  ```

  理解一下就是我们将需要代理的对象、方法、参数传入invoke，然后再invoke里面调用代理实例的处理程序实现代理功能，其实跟上面的静态代理思想类似，比如在`UserServiceProxy`中调用代理对象`userService`相对应的处理程序

* `Proxy`,官方文档说明上介绍：“`Proxy` provides static methods for creating dynamic proxy classes and instances, and it is also the superclass of all dynamic proxy classes created by those methods.”（翻译：`Proxy` 提供用于创建动态代理类和实例的静态方法，它还是由这些方法创建的所有动态代理类的超类。）

  `Proxy`中提供了一个静态方法
  
  ```java
  static Object	newProxyInstance(ClassLoader loader, Class<?>[] interfaces, InvocationHandler h)
  //Returns an instance of a proxy class for the specified interfaces that dispatches method invocations to the specified invocation handler. 返回指定接口的代理类的实例，该实例将方法调用分派到指定的调用处理程序。
  ```

代码实现上，先创建一个ProxyInvocationHandler实现InvocationHandler：

```java
package com.zhouning.service;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

public class ProxyInvocationHandler implements InvocationHandler {
    //目标对象，需要代理的对象
    private Object target;

    public void setTarget(Object target) {
        this.target = target;
    }

    /***
     *
     * @return  代理对象
     */
    public Object getProxy(){
        return Proxy.newProxyInstance(this.getClass().getClassLoader(), target.getClass().getInterfaces(), this);
    }
    
    /***
     *
     * @param proxy     代理类
     * @param method    代理类的调用处理程序方法对象
     * @param args      参数
     * @return
     * @throws Throwable
     */
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) 
        throws Throwable {
        log(method.getName());
        Object result = method.invoke(target, args);
        return Object;
    }

    /**
     * 日志
     * @param methodName
     */
    public void log(String methodName){
        System.out.println("调用了"+methodName+"方法");
    }
}

```

调用：

```java
    public static void main(String[] args) {
        UserService userService = new UserServiceImpl();
        ProxyInvocationHandler pih = new ProxyInvocationHandler();
        //设置代理对象
        pih.setTarget(userService);
        UserService proxy = (UserService) pih.getProxy();
        proxy.add();
    }
```

这样我们就实现了动态的代理，似乎来说动态代理比静态代理要复杂一些，那么为什么不用更加简单一些的静态代理呢？首先是我们可以看到动态代理处理上更加简洁，其次是动态代理可以处理一类的业务逻辑，加入说下次有另外一个`service`需求，我们基本上不需要重写一个代理类，直接使用现在这个动态代理类就行，减少了工作量。



## 总结

在学习spring_aop之前先学习了一下代理的内容，做个小结养成好习惯。