# spring依赖注入

## 简介

主要对spring当中各种各样数据注入的讲解，比如：数组、List、Map、Set等，他们的注入方法有相同的地方也有一些简单的区别，自己手动写一下方便后面忘记了。

## 各种类型的注入

我们的需求是设计一个学生类，然后学生的信息有姓名、地址、书本、爱好等

Student代码如下：

```java
/***
            *
            * @author zhouning
 *  books 代表拥有的书
 *  grade 代表成绩
 *  games 代表喜欢的游戏
 *  properties 代表属性
 */
    public class Student {
        private String name;
        private Address address;
        private String[] books;
    private List<String> hobbies;
    private Map<String,Integer> grade;
    private Set<String>games;
    private String phoneNumber;
    private Properties properties;


    public void setProperties(Properties properties) {
        this.properties = properties;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public void setGames(Set<String> games) {
        this.games = games;
    }

    public void setHobbies(List<String> hobbies) {
        this.hobbies = hobbies;
    }

    public void setBooks(String[] books) {
        this.books = books;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setGrade(Map<String, Integer> grade) {
        this.grade = grade;
    }

    public Student() {}
}

```

其中Address代码：

```java
public class Address {
    String addr;

    public String getAddr() {
        return addr;
    }

    public void setAddr(String addr) {
        this.addr = addr;
    }

    @Override
    public String toString() {
        return "Address{" +
                "addr='" + addr + '\'' +
                '}';
    }
}
```

配置文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:p="http://www.springframework.org/schema/p"
       xmlns:c="http://www.springframework.org/schema/c"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
    <!--    地址-->
    <bean id="addr" class="com.zhouning.Address" >
        <property name="addr" value="武汉"/>
    </bean>

    <bean id="student" class="com.zhouning.Student" >
    <!--        对于普通的变量“name”进行注入-->
        <property name="name" value="张三"></property>
    <!--        对于bean的注入-->
        <property name="address" ref="addr"></property>
    <!--        对于数组的注入-->
        <property name="books">
            <array>
                <value>C++入门到精通</value>
                <value>java入门到精通</value>
                <value>mysql数据库讲解</value>
                <value>数据结构和算法</value>
            </array>
        </property>
    <!--        对于list注入-->
        <property name="hobbies">
            <list>
                <value>写代码</value>
                <value>看书</value>
                <value>打球</value>
            </list>
        </property>
<!--        对于map注入-->
        <property name="grade">
            <map>
                <entry key="高数" value="85"></entry>
                <entry>
                    <key><value>面向对象</value></key>
                    <value>87</value>
                </entry>
            </map>
        </property>
<!--        对于set的注入-->
        <property name="games">
            <set>
                <value>LoL</value>
                <value>DNF</value>
            </set>
        </property>
<!--        null注入-->
        <property name="phoneNumber" >
           <null></null>
        </property>
        
        <property name="properties">
            <props>
                <prop key="学号">20171001111</prop>
                <prop key="专业">计算机和科学</prop>
            </props>
        </property>
    </bean>
<!--    p命名空间注入-->
    <bean id="addr1" class="com.zhouning.Address" p:addr="北京"></bean>
<!--    c命名空间注入-->
    <bean id="addr2" class="com.zhouning.Address" c:addr="上海"></bean>
</beans>
```



### 一、常量注入

```xml
  <!--        对于普通的变量“name”进行注入-->
   <property name="name" value="张三"></property>
```

常量注入是对普通类型的注入，比如：String、int、float等

### 二、bean注入

```xml
<!--        对于bean的注入-->
        <property name="address" ref="addr"></property>
```

bean的注入是先创建其他的bean，然后使用`ref`进行引用注入

### 三、数组注入

```xml
 <!--        对于数组的注入-->
        <property name="books">
            <array>
                <value>C++入门到精通</value>
                <value>java入门到精通</value>
                <value>mysql数据库讲解</value>
                <value>数据结构和算法</value>
            </array>
        </property>
```

数组注入比较简单

### 四、List注入

```xml
  <!--        对于list注入-->
        <property name="hobbies">
            <list>
                <value>写代码</value>
                <value>看书</value>
                <value>打球</value>
            </list>
        </property>
```

注入比较简单

### 五、Map注入

```xml
<!--        对于map注入-->
        <property name="grade">
            <map>
                <entry key="高数" value="85"></entry>
                <entry>
                    <key><value>面向对象</value></key>
                    <value>87</value>
                </entry>
            </map>
        </property>
```

Map注入时元素是`entry`,然后分别对`entry`里面的`key和value`注入就行

### 六、Set注入

```xml
<!--        对于set的注入-->
        <property name="games">
            <set>
                <value>LoL</value>
                <value>DNF</value>
            </set>
        </property>
```

set注入和前面的数组和list注入差不多

### 七、null注入

```xml
<!--        null注入-->
        <property name="phoneNumber" >
           <null></null>
        </property>
```

null注入九比较鸡肋了，一般来说你不注入他本身也应该是null

### 八、Properties注入

```xml
<!--        Properties注入-->
        <property name="properties">
            <props>
                <prop key="学号">20171001111</prop>
                <prop key="专业">计算机和科学</prop>
            </props>
        </property>
```

Properties类似于Map的配置

### 九、p命名空间注入

```xml
<!--    p命名空间注入-->
    <bean id="addr1" class="com.zhouning.Address" p:addr="北京"></bean>
```

p命名空间的注入需要添加一下`xmlns:p="http://www.springframework.org/schema/p"`,p其实是属性的意思。

### 十、c命名空间注入

```xml
<!--    c命名空间注入-->
    <bean id="addr2" class="com.zhouning.Address" c:addr="上海"></bean>
```

c命名空间注入需要添加一下`xmlns:c="http://www.springframework.org/schema/c"`,c命名空间注入需要有构造函数的支撑，c就是构造函数的意思。



## 总结

总结一下学习的spring的注入方法，其中如果**对属性进行注入一定需要有Set方法**，如果**对构造函数进行注入，则一定有对应的构造方法**，继续学习spring当中。







