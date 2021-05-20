# spring中AOP个人总结

## 简介

aop（aspect oriented programming）面向切面编程是spring当中一个重要内容，在学习之后感觉这个思想挺不错的，做个总结

## AOP讲解

### 一、面向切面编程

​		听说过面向对象编程（oop），但是面向切面编程还真是第一次听说，那面向切面编程到底是什么呢？

​		面向切面编程是一种横向的编程方式，横向是一种平行的意思。在spring当中有很多的竖向的图，如下：

<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/aop1.png" alt="aop1" style="zoom: 50%;" />

​		`action`中会调用到`service`，`service`当中会调用到`dao`,这样的类似一层一层的在spring当中认为是一种竖向编程，竖向编程结构清晰。

​		横向编程类似于下面这种，在`service`和`log`是两个模块，两者独立，但是在`service`调用的时候，希望能够通过`log`模块打印日志信息，我们将l当作一个切面横插进去，就是一种横向编程的思维。

​														<img src="https://gitee.com/zhou-ning/BlogImage/raw/master/java/aop2.png" alt="奥普" style="zoom: 50%;" />

​		这样编程的好处就是真实角色处理的业务更加纯粹，不用去关注一些公共的事情（如：日志、安全、缓存等），其实和前面所讲的[java代理](https://blog.csdn.net/qq_41474648/article/details/105759730)的作用相同。

### 二、相对应的概念

* 关注点(Pointcuts)：增加的某个业务，比如：日志、安全、缓存、事务等。
* 切面（Aspect）：一个关注点的模块。
* 通知(Advice)：在切面的某个特定的连接点上执行的动作，通知有前置通知、后置通知、返回通知、异常通知、环绕通知。
  * 前置通知：发生在方法执行调用之前
  * 返回通知：方法运行之后，得到结果返回后
  * 后置通知：发生在返回通知之后
  * 异常通知：运算异常才有的通知
  * 环绕通知：可以得到上面所有的通知
* 织入（Weaving）:把切面连接道应用程序上，比如：把l`log`连接到`seervice`上。

### 三、代码实现

代码实现都是使用idea作为ide实现的，其中怎么创建可以参考[这篇文章](https://blog.csdn.net/qq_44614710/article/details/86763057)，然后我们目前的需求就是创建一个`ArithmeticCalculator`进行加减乘除，然后在`ArithmeticCalculator`里面插入`log`

先创建接口`ArithmeticCalculator`

```java
package com.zhouning;

/**
 * @author zhouning
 */
public interface ArithmeticCalculator {

    int add(int i, int j);
    int sub(int i, int j);
    int mul(int i, int j);
    int div(int i, int j);
}


```

使用类去实现

```java
package com.zhouning;

/**
 * @author zhouning
 */
public class ArithmeticCalculatorImpl implements ArithmeticCalculator{
    @Override
    public int add(int i, int j) {
        int result = i + j;
        return result;
    }

    @Override
    public int sub(int i, int j) {
        int result = i - j;
        return result;
    }

    @Override
    public int mul(int i, int j) {
        int result = i * j;
        return result;
    }

    @Override
    public int div(int i, int j) {
        int result = i / j;
        return result;
    }
}
```

1. 通过springAPI来实现

   API实现的话我们首先需要实现相对应的接口，如：`MethodBeforeAdvice`（前置通知），可以参考[官方文档](https://docs.spring.io/spring/docs/5.2.5.RELEASE/spring-framework-reference/core.html#aop-api-advice-before)上的接口介绍，我这里实现的是前置通知的接口。

   Log：

   ```java
   package com.zhouning.log;
   
   import org.springframework.aop.MethodBeforeAdvice;
   
   import java.lang.reflect.Method;
   
   /**
    * @author zhouning
    */
   public class Log implements MethodBeforeAdvice {
   
   
       /**
        *
        * @param method    被调用的方法对象
        * @param args      被调用的方法参数
        * @param o         被调用方法的目标参数
        * @throws Throwable
        */
       @Override
       public void before(Method method, Object[] args, Object o) throws Throwable {
           System.out.println(o.getClass().getName()+"的"+method.getName()+"方法被调用");
   
       }
   }
   
   ```

   对应的配置：

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <beans xmlns="http://www.springframework.org/schema/beans"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:aop="http://www.springframework.org/schema/aop"
          xsi:schemaLocation="http://www.springframework.org/schema/beans 		http://www.springframework.org/schema/beans/spring-beans.xsd
           http://www.springframework.org/schema/aop
           http://www.springframework.org/schema/aop/spring-aop.xsd">
   
       <bean id="arithmeticCalculator" class="com.zhouning.ArithmeticCalculatorImpl"></bean>
       <bean id="log" class="com.zhouning.log.Log" ></bean>
       <aop:config>
           <aop:pointcut id="pointcut" expression="execution(* com.zhouning.ArithmeticCalculatorImpl.*(..))"/>
           <aop:advisor advice-ref="log" pointcut-ref="pointcut"></aop:advisor>
       </aop:config>
   
   </beans>
   ```

   调用：

   ```java
    public static void main(String[] args) {
           ApplicationContext applicationContext = new ClassPathXmlApplicationContext("bean.xml");
           ArithmeticCalculator arithmeticCalculator = (ArithmeticCalculator) applicationContext.getBean("arithmeticCalculator");
           arithmeticCalculator.add(1, 1);
        	System.out.println("-------------------------------------");
           arithmeticCalculator.sub(10, 0);
   
       }
   ```

   输出：

   ```powershell
   com.zhouning.ArithmeticCalculatorImpl的add方法被调用
   -------------------------------------
   com.zhouning.ArithmeticCalculatorImpl的sub方法被调用
   ```

   

   需要注意的点：

   * spring—aop需要的包一定要导入正确，开始我有个包没有导入，导致弄了半天

   * 一定要在` xsi:schemaLocation`上加入`http://www.springframework.org/schema/aop http://www.springframework.org/schema/aop/spring-aop.xsd`

   * 表达式`execution()`中参数介绍：第一个`*`代表返回值不限；第二个`*`代表方法；括号中的`..`代表参数

   * 这种直接使用SpringAPI的方法使用不多

     

2. 自定义类实现（基于配置文件）

   第一种方法虽然也能够使用，但是用起来还是比较麻烦的，如果通知多了继承的接口也会增加，所以采取自定义类的方法要简单一些。

   新建一个LoggingAspect：

   ```java
   package com.zhouning.log;
   
   import org.aspectj.lang.JoinPoint;
   import org.aspectj.lang.ProceedingJoinPoint;
   import org.aspectj.lang.annotation.Around;
   
   import java.util.Arrays;
   
   public class LoggingAspect {
       /**
        * 前置通知
        * @param joinPoint 连接点
        */
       public void beforeMethod(JoinPoint joinPoint){
           String methodName = joinPoint.getSignature().getName();
           Object [] args = joinPoint.getArgs();
   
           System.out.println("前置通知： The method " + methodName + " begins with " + Arrays.asList(args));
       }
   
       /***
        * 后置通知
        * @param joinPoint
        */
       public void afterMethod(JoinPoint joinPoint){
   
           String methodName = joinPoint.getSignature().getName();
           System.out.println("后置通知： The method " + methodName + " ends");
       }
   
       /***
        * 返回通知
        * @param joinPoint
        * @param result    最终计算得到的结果
        */
       public void afterReturning(JoinPoint joinPoint, Object result){
           String methodName = joinPoint.getSignature().getName();
           System.out.println("返回通知： The method " + methodName + " ends with " + result);
       }
   
       /**
        * 异常通知
        * @param joinPoint
        * @param e 异常结构
        */
       public void afterThrowing(JoinPoint joinPoint, Exception e){
           String methodName = joinPoint.getSignature().getName();
           System.out.println("异常通知： The method " + methodName + " occurs excetion:" + e);
       }
   
       /***
        * 环绕通知
        * @param pjd
        * @return
        */
       public Object aroundMethod(ProceedingJoinPoint pjd){
   
           Object result = null;
           String methodName = pjd.getSignature().getName();
   
           try {
               //前置通知
               System.out.println("环绕通知 The method " + methodName + " begins with " + Arrays.asList(pjd.getArgs()));
               //执行目标方法
               result = pjd.proceed();
               //返回通知
               System.out.println("环绕通知 The method " + methodName + " ends with " + result);
           } catch (Throwable e) {
               //异常通知
               System.out.println("环绕通知 The method " + methodName + " occurs exception:" + e);
               throw new RuntimeException(e);
           }
           //后置通知
           System.out.println("环绕通知 The method " + methodName + " ends");
           return result;
       }
   }
   
   
   ```

   配置文件：

   ```java
   <?xml version="1.0" encoding="UTF-8"?>
   <beans xmlns="http://www.springframework.org/schema/beans"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:aop="http://www.springframework.org/schema/aop"
          xsi:schemaLocation="http://www.springframework.org/schema/beans 		http://www.springframework.org/schema/beans/spring-beans.xsd
           http://www.springframework.org/schema/aop
           http://www.springframework.org/schema/aop/spring-aop.xsd">
   
       <bean id="arithmeticCalculator" class="com.zhouning.ArithmeticCalculatorImpl"></bean>
       <bean id="loggingAspect" class="com.zhouning.log.LoggingAspect" ></bean>
       <!-- 配置 AOP -->
       <aop:config>
           <!-- 配置切点表达式 -->
           <aop:pointcut expression="execution(* com.zhouning.ArithmeticCalculatorImpl.*(..))"
                         id="pointcut"/>
           <!-- 配置切面及通知 -->
           <aop:aspect ref="loggingAspect" order="2">
               <aop:before method="beforeMethod" pointcut-ref="pointcut"/>
               <aop:after method="afterMethod" pointcut-ref="pointcut"/>
               <aop:after-throwing method="afterThrowing" pointcut-ref="pointcut" throwing="e"/>
               <aop:after-returning method="afterReturning" pointcut-ref="pointcut" returning="result"/>
               <aop:around method="aroundMethod" pointcut-ref="pointcut"/>
           </aop:aspect>
       </aop:config>
   
   </beans>
   ```

   调用方法不变，输出：

   ```powershell
   前置通知： The method add begins with [1, 1]
   环绕通知 The method add begins with [1, 1]
   环绕通知 The method add ends with 2
   环绕通知 The method add ends
   返回通知： The method add ends with 2
   后置通知： The method add ends
   -------------------------------------
   前置通知： The method sub begins with [10, 0]
   环绕通知 The method sub begins with [10, 0]
   环绕通知 The method sub ends with 10
   环绕通知 The method sub ends
   返回通知： The method sub ends with 10
   后置通知： The method sub ends
   ```

   这样似乎体现不出异常通知的作用，所以改变一下调用方式：

   ```java
      public static void main(String[] args) {
           ApplicationContext applicationContext = new ClassPathXmlApplicationContext("bean.xml");
           ArithmeticCalculator arithmeticCalculator = (ArithmeticCalculator) applicationContext.getBean("arithmeticCalculator");
           arithmeticCalculator.div(10, 0);
       }
   ```

   输出：

   ```powershell
   前置通知： The method div begins with [10, 0]
   环绕通知 The method div begins with [10, 0]
   环绕通知 The method div occurs exception:java.lang.ArithmeticException: / by zero
   异常通知： The method div occurs excetion:java.lang.RuntimeException: java.lang.ArithmeticException: / by zero
   后置通知： The method div ends
   Exception in thread "main" java.lang.RuntimeException: java.lang.ArithmeticException: / by zero
   ```

   可以看到“返回通知”没有了，但是后置通知依旧存在。

   

   

   ​		这时候忽然想到另外一个问题，如果我有两个Aspect该怎么办？该如何控制两个Aspect中相对应的执行顺序呢？

   ​		其实spring可我们以及提供了控制两个Aspect的方法那就是`order`,我们可以通过，对`order`设置大小从而决定顺序，`order`越小等级越高也就越先执行。

   

   

3. 通过注解实现

   更改LoggingAspect代码：

   ```java
   package com.zhouning.log;
   
   import org.aspectj.lang.JoinPoint;
   import org.aspectj.lang.ProceedingJoinPoint;
   import org.aspectj.lang.annotation.*;
   
   import java.util.Arrays;
   @Order(2)
   @Aspect
   public class LoggingAspect {
       /**
        * 定义一个方法, 用于声明切入点表达式. 一般地, 该方法中再不需要添入其他的代码.
        * 使用 @Pointcut 来声明切入点表达式.
        * 后面的其他通知直接使用方法名来引用当前的切入点表达式.
        */
       @Pointcut("execution(* com.zhouning.ArithmeticCalculator.*(..))")
       public void declareJointPointExpression(){}
   
       /**
        * 在 ArithmeticCalculator 接口的每一个实现类的每一个方法开始之前执行一段代码
        */
       @Before("declareJointPointExpression()")
       public void beforeMethod(JoinPoint joinPoint){
           String methodName = joinPoint.getSignature().getName();
           Object [] args = joinPoint.getArgs();
   
           System.out.println("前置通知 The method " + methodName + " begins with " + Arrays.asList(args));
       }
   
       /**
        * 在方法执行之后执行的代码. 无论该方法是否出现异常
        */
       @After("declareJointPointExpression()")
       public void afterMethod(JoinPoint joinPoint){
           String methodName = joinPoint.getSignature().getName();
           System.out.println("后置通知 The method " + methodName + " ends");
       }
   
       /**
        * 在方法法正常结束受执行的代码
        * 返回通知是可以访问到方法的返回值的!
        */
       @AfterReturning(value="declareJointPointExpression()",
               returning="result")
       public void afterReturning(JoinPoint joinPoint, Object result){
           String methodName = joinPoint.getSignature().getName();
           System.out.println("返回通知 The method " + methodName + " ends with " + result);
       }
   
       /**
        * 在目标方法出现异常时会执行的代码.
        * 可以访问到异常对象; 且可以指定在出现特定异常时在执行通知代码
        */
       @AfterThrowing(value="declareJointPointExpression()",
               throwing="e")
       public void afterThrowing(JoinPoint joinPoint, Exception e){
           String methodName = joinPoint.getSignature().getName();
           System.out.println("异常通知 The method " + methodName + " occurs excetion:" + e);
       }
   
       /**
        * 环绕通知需要携带 ProceedingJoinPoint 类型的参数.
        * 环绕通知类似于动态代理的全过程: ProceedingJoinPoint 类型的参数可以决定是否执行目标方法.
        * 且环绕通知必须有返回值, 返回值即为目标方法的返回值
        */
   	@Around("declareJointPointExpression()")
   	public Object aroundMethod(ProceedingJoinPoint pjd){
   
   		Object result = null;
   		String methodName = pjd.getSignature().getName();
   
   		try {
   			//前置通知
   			System.out.println("环绕通知 The method " + methodName + " begins with " + Arrays.asList(pjd.getArgs()));
   			//执行目标方法
   			result = pjd.proceed();
   			//返回通知
   			System.out.println("环绕通知 The method " + methodName + " ends with " + result);
   		} catch (Throwable e) {
   			//异常通知
   			System.out.println("环绕通知 The method " + methodName + " occurs exception:" + e);
   			throw new RuntimeException(e);
   		}
   		//后置通知
   		System.out.println("环绕通知 The method " + methodName + " ends");
   		return result;
   	}
   
   }
   
   ```

   配置文件：

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <beans xmlns="http://www.springframework.org/schema/beans"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:aop="http://www.springframework.org/schema/aop"
          xsi:schemaLocation="http://www.springframework.org/schema/beans 		http://www.springframework.org/schema/beans/spring-beans.xsd
           http://www.springframework.org/schema/aop
           http://www.springframework.org/schema/aop/spring-aop.xsd">
   
       <bean id="arithmeticCalculator" class="com.zhouning.ArithmeticCalculatorImpl"></bean>
       <bean id="loggingAspect" class="com.zhouning.log.LoggingAspect" ></bean>
   
       <!-- 配置自动为匹配 aspectJ 注解的 Java 类生成代理对象 -->
       <aop:aspectj-autoproxy></aop:aspectj-autoproxy>
   
   </beans>
   ```

   输出跟上面相同

   注意的地方：

   * 需要在配置文件当中加上自动配置` <aop:aspectj-autoproxy></aop:aspectj-autoproxy>`
   * ` @Pointcut`是切面表达式，使用之后后面的表达式可以简化

   

4. 有多个Aspect的情况

   如果是多个Aspect，想要有执行的顺序，可以设置`order`指定切面的优先级, 值越小优先级越高。

   如创建一个VlidationAspect：

   ```java
   @Order(1)
   @Aspect
   @Component
   public class VlidationAspect {
   
   	@Before("com.zhouning.log.LoggingAspect.declareJointPointExpression()")
   	public void validateArgs(JoinPoint joinPoint){
   		System.out.println("-->validate:" + Arrays.asList(joinPoint.getArgs()));
   	}
   	
   }
   ```

   或者通过配置文件xml指定：

   ```xml
   <!-- 配置 AOP -->
   	<aop:config>
   		<!-- 配置切点表达式 -->
   		<aop:pointcut expression="execution(* com.zhouning.ArithmeticCalculator.*(int, int))" 
   			id="pointcut"/>
   		<!-- 配置切面及通知,通过order指定等级 -->
   		<aop:aspect ref="loggingAspect" order="2">
   			<aop:before method="beforeMethod" pointcut-ref="pointcut"/>
   			<aop:after method="afterMethod" pointcut-ref="pointcut"/>
   			<aop:after-throwing method="afterThrowing" pointcut-ref="pointcut" throwing="e"/>
   			<aop:after-returning method="afterReturning" pointcut-ref="pointcut" returning="result"/>
   			<!--  
   			<aop:around method="aroundMethod" pointcut-ref="pointcut"/>
   			-->
   		</aop:aspect>	
   		<aop:aspect ref="vlidationAspect" order="1">
   			<aop:before method="validateArgs" pointcut-ref="pointcut"/>
   		</aop:aspect>
   	</aop:config>
   ```



## 总结

简单的学习了一下spring—aop的内容，aop的内部原理其实就是动态代理不过通过spring实现起来更加简单，感觉aop还是挺有用的，其实还有许多细节有待弄清，写的比较多也有点乱，等以后有新的体会后再补一下。加油！

