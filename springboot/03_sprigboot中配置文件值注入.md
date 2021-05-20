# sprigboot中配置文件值注入

# 介绍

在springboot当中有时候我们会写一些bean和配置文件进行映射，那么我们如何将配置文件当中的值注入到bean当中去呢？一般我们会使用`@ConfigurationProperties`进行相应的注入

## 讲解

### 1.使用`@ConfigurationProperties`

写一个Person和dog类 

```java
@Component
@ConfigurationProperties(prefix = "person")
public class Person {
    private String lastName;
    private Integer age;
    private Boolean boss;
    private Date birth;

    private Map<String,Object> maps;
    private List<Object> lists;
    private Dog dog;

    @Override
    public String toString() {
        return "Person{" +
                "lastName='" + lastName + '\'' +
                ", age=" + age +
                ", boss=" + boss +
                ", birth=" + birth +
                ", maps=" + maps +
                ", lists=" + lists +
                ", dog=" + dog +
                '}';
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public Boolean getBoss() {
        return boss;
    }

    public void setBoss(Boolean boss) {
        this.boss = boss;
    }

    public Date getBirth() {
        return birth;
    }

    public void setBirth(Date birth) {
        this.birth = birth;
    }

    public Map<String, Object> getMaps() {
        return maps;
    }

    public void setMaps(Map<String, Object> maps) {
        this.maps = maps;
    }

    public List<Object> getLists() {
        return lists;
    }

    public void setLists(List<Object> lists) {
        this.lists = lists;
    }

    public Dog getDog() {
        return dog;
    }

    public void setDog(Dog dog) {
        this.dog = dog;
    }
}

```

```java
public class Dog {
    private String name;
    private Integer age;

    @Override
    public String toString() {
        return "Dog{" +
                "name='" + name + '\'' +
                ", age=" + age +
                '}';
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }
}

```

然后在application.yml配置：

```yaml
person:
  lastName: 张三
  age: 18
  birth: 2020/5/1
  boss: false
  maps: {k1: v1,k2: v2}
  lists:
    - lisi
    - zhaoliu

  dog:
    name: 小狗
    age: 2


```

在springboot得测试当中：

```java
@SpringBootTest
class SpringBoot02ConfigApplicationTests {

    @Autowired
    Person person;
    @Test
    void contextLoads() {
        System.out.println(person);
    }

}
```

最终输出：

```powershell
Person{lastName='张三', age=18, boss=false, birth=Fri May 01 00:00:00 CST 2020, maps={k1=v1, k2=v2}, lists=[lisi, zhaoliu], dog=Dog{name='小狗', age=2}}
```

可以是可以进行配置得注入的

需要注意的点:

* 需要导入依赖

  ```xml
  <dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring‐boot‐configuration‐processor</artifactId>
  <optional>true</optional>
  </dependency>
  ```

  我在pow.xml当中在这样导入并且没有成功，但是看网上都是这样导入的，所以记一下。可能因为我目前最新版的springboot（2.26版）出现了这样的问题，我直接从maven中央仓库找到这个包，然后使用了他给的导入方法

  ```java
  <!--        导入依赖-->
          <dependency>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-configuration-processor</artifactId>
              <version>2.2.6.RELEASE</version>
          </dependency>
  ```

  版本需要对应一下

* 我的主类是`SpringBoot02ConfigApplication`,所有对应的测试类是`SpringBoot02ConfigApplicationTests`,是自己生成的，不需要我们自己创建这个类

* 如果是在application.properties文件进行配置也可以达到相同效果

  ```properties
  person.last-name=张三
  person.age=18
  person.birth=2020/5/1
  person.boss=false
  person.maps.k1=v1
  person.maps.k2=v2
  person.lists=lisi,zhaoliu
  person.dog.name=小狗
  person.dog.age=2
  
  ```

  如果出现乱码只需要在settinfgs里面搜索File Encoding,然后，然后将Properties的设置改成下面一样就行

  ![sprigboot中配置文件值注入01](https://gitee.com/zhou-ning/BlogImage/raw/master/java/sprigboot中配置文件值注入01.png)

  ​	

### 2.和`@Value`的区别

`@Value`也可以给bean文件中注入值，具体的用法类似于这样：

```java
public class Person {
/**
* <bean class="Person">
* <property name="lastName" value="字面量/${key}从环境变量、配置文件中获取值/#
{SpEL}"></property>
* <bean/>
*/
//@Value("${person.last‐name}")
private String lastName;
//@Value("#{11*2}")
private Integer age;
//@Value("true")
private Boolean boss;
```

但是`@Value`跟`@ConfigurationProperties`相比功能相对来说弱一些，有很多区别

|                | @ConfigurationProperties       | @Value                                                 |
| -------------- | ------------------------------ | ------------------------------------------------------ |
| 功能上         | 可以批量注入配置文件当中的属性 | 可以注入配置文件的值或者其他的值，但是需要一个一个指定 |
| 松散语法       | 支持                           | 不支持                                                 |
| SpEL           | 不支持                         | 支持                                                   |
| JSR303数据校验 | 支持                           | 不支持                                                 |
| 复杂类型封装   | 支持                           | 不支持                                                 |

解释：

* 松散语法就是类似`lastName、last-name、last_name`这种命名的方法。简单说就是`@ConfigurationProperties`中属性命名这些方法都可以
* JSR303数据校验是指可以通过在类上面加`@Validated`，来进行属性值的验证

## 总结

继续学习springboot当中，加油