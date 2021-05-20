# springboot中自动配置笔记

## 简介

刚开始学习springboot的时候有一些自动配置的细节笔记，记录一下

## 讲解

### 1、spring-boot-starter-parent

​		在"pom.xml"文件当中，我们可以看到下面的配置

```xml
 <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.6.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
 </parent>
```

​		这个是springboot的父项目，然后我们点击这个`spring-boot-starter-parent`,进入进去发现如下：

```xml
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-dependencies</artifactId>
    <version>2.2.6.RELEASE</version>
    <relativePath>../../spring-boot-dependencies</relativePath>
  </parent>
```

​		还有一个父项目（套娃），继续点击`spring-boot-dependencies`，向下拉可以发现各种各样的依赖版本：

![spring自动配置01](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置01.png)

**结论：**

​		`	spring-boot-dependencies`是Spring Boot的版本仲裁中心，一般来说我们导入依赖是不需要写版本的，基本上的依赖版本都会在`spring-boot-dependencies`进行管理，方便我们进行开发。

### 2、spring-boot-starter(启动器)

​		既然上面只是对版本进行管理，那么我们的依赖是怎么导入的呢？我们继续观察“pom.xml”，

我们可以看到这个依赖：

```xml
<dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

​		可以看到`spring-boot-starter-web`跟上面的`spring-boot-starter-parent`只是相差的后面，一个是`web`一个是`start`,这个在springboot当中还是挺常见的。

我们点击`spring-boot-starter-web`，发现很多和web相关的依赖，例如：json、tomcat等：

![spring自动配置02](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置02.png)

**结论：**

​		spring-boot-starter是spring-boot场景启动器,而`spring-boot-starter-web`帮我们导入了web模块正常运行所依赖的组件，其中依赖的版本都由`spring-boot-starter-parent`帮助我们进行仲裁。

​		类似的其实spring boot将所有功能场景都抽取了出来，做成了一个个starts，当我们需要什么时，只需要在项目当中引入这些starter就能将相关场景的依赖都导入进来，并且版本都不需要我们进行控制，因为版本在`spring-boot-starter-parent`当中就已经被控制了，所以说非常方便。比如说我们需要邮件开发的场景，我们就只需要导入`spring-boot-starter-mail`,他就把相对应的依赖导入进来。starters介绍的官方文档：[传送门](https://docs.spring.io/spring-boot/docs/2.2.6.RELEASE/reference/html/using-spring-boot.html#using-boot-starter)

### 3、主程序入口类

​		主程序入口类是这样：

```java
@SpringBootApplication
public class SpringBoot01HelloworldQuickApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringBoot01HelloworldQuickApplication.class, args);
    }

}
```

其中**@SpringBootApplication**: 

​		Spring Boot应用标注在某个类上说明这个类是SpringBoot的主配置类，SpringBoot 就应该运行这个类的main方法来启动SpringBoot应用。

我们点开**@SpringBootApplication**，发现

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(
    excludeFilters = {@Filter(
    type = FilterType.CUSTOM,
    classes = {TypeExcludeFilter.class}
), @Filter(
    type = FilterType.CUSTOM,
    classes = {AutoConfigurationExcludeFilter.class}
)}
)
public @interface SpringBootApplication {
    ....
}
```

**@SpringBootConfiguration**：

​		Spring Boot的配置类，标注在某个类上，表示这是一个Spring Boot的配置类。我们点击进去，会发现它是由`@Configuration`组成的，而`@Configuration`就是spring中的注解，标志一个配置类。



**@EnableAutoConfiguration：**

​		开启自动配置功能，加上`@EnableAutoConfiguration`之后，springboot能够帮助我们自动配置这个注解，相当于开启自动配置功能。

那`@EnableAutoConfiguration`具体是什么样的呢？我们点击`@EnableAutoConfiguration`进去，发现：

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage
@Import({AutoConfigurationImportSelector.class})
public @interface EnableAutoConfiguration {
    String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";

    Class<?>[] exclude() default {};

    String[] excludeName() default {};
}

```

​		我们又发现了`@AutoConfigurationPackage`这个注解，我们继续点击进去发现：

```java
@Inherited
@Import({Registrar.class})
public @interface AutoConfigurationPackage {}
```

​		我们发现了spring的底层注解`@Import`，该注解的作用是给容器中导入一个组件，组件由括号中的内容决定。也说明了`@AutoConfigurationPackage`是由`@Import`中导入的这个类起作用。

​		我们继续点击`Registrar`这个类，发现

```java
   static class Registrar implements ImportBeanDefinitionRegistrar, DeterminableImports {
        Registrar() {
        }

        public void registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
            AutoConfigurationPackages.register(registry, (new AutoConfigurationPackages.PackageImport(metadata)).getPackageName());
        }

        public Set<Object> determineImports(AnnotationMetadata metadata) {
            return Collections.singleton(new AutoConfigurationPackages.PackageImport(metadata));
        }
    }
```

​		我们在`registerBeanDefinitions`设置一个断点，然后调试

![spring自动配置03](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置03.png)

![spring自动配置04](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置04.png)

![spring自动配置05](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置05.png)

包结构：

![包结构](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置06.png)

​		发现`metadata`传入的就是主类，而`(new AutoConfigurationPackages.PackageImport(metadata))`则是得到了主类所在的包。这其实也就说明了**@AutoConfigurationPackage**的作用：==将主配置类（@SpringBootApplication标注的类）的所在包及下面所有子包里面的所有组件扫描到Spring容器==



​		接着我们发现在`@AutoConfigurationPackage`下面还有一个`@Import({AutoConfigurationImportSelector.class})`注解。我们点进`AutoConfigurationImportSelector`，发现这么一个函数

```java
    protected AutoConfigurationImportSelector.AutoConfigurationEntry getAutoConfigurationEntry(AutoConfigurationMetadata autoConfigurationMetadata, AnnotationMetadata annotationMetadata) {
        if (!this.isEnabled(annotationMetadata)) {
            return EMPTY_ENTRY;
        } else {
            AnnotationAttributes attributes = this.getAttributes(annotationMetadata);
            List<String> configurations = this.getCandidateConfigurations(annotationMetadata, attributes);
            configurations = this.removeDuplicates(configurations);
            Set<String> exclusions = this.getExclusions(annotationMetadata, attributes);
            this.checkExcludedClasses(configurations, exclusions);
            configurations.removeAll(exclusions);
            configurations = this.filter(configurations, autoConfigurationMetadata);
            this.fireAutoConfigurationImportEvents(configurations, exclusions);
            return new AutoConfigurationImportSelector.AutoConfigurationEntry(configurations, exclusions);
        }
    }
```

同理设置断点调试

![spring自动配置07](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置07.png)

发现124个自动配置类

![spring自动配置08](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置08.png)

​		那么该类的功能就是将一些需要的配置类导入进来并且配置好，比如说我们需要aop功能，那么它就将aop的自动配置类`org.springframework.boot.autoconfigure.aop.AopAutoConfiguration`导入了进来，并且配置好。有了自动配置类，免去了我们手动编写配置注入功能组件等的工作。

​		其实Spring Boot在启动的时候从类路径下的**META-INF/spring.factories**中获取EnableAutoConfiguration指定的值，将 这些值作为自动配置类导入到容器中，自动配置类就生效，帮我们进行自动配置工作；以前我们在spring中需要自己配置的东西，自动配置类都帮我们完成了。整体的配置都在spring-boot-autoconfigure-2.2.6.RELEASE.jar中（springboot版本不同，这个可能版本也会不同）

![spring自动配置09](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置09.png)

spring.factories文件内容：

![spring自动配置10](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置10.png)

发现了前面调试的相同的内容

然后我们打开AopAutoConfiguration：

![spring自动配置11](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置11.png)

里面都是一些和配置相关的内容

**结论：**

**@EnableAutoConfiguration：**

* 利用**@AutoConfigurationPackage**将主配置类（@SpringBootApplication标注的类）的所在包及下面所有子包里面的所有组件扫描到Spring容器
* 利用`@Import({AutoConfigurationImportSelector.class})`注解将xxxAutoConfiguration类加入到容器当中



### 4.以HttpEncodingAutoConfiguration为例讲解学习的到一些东西

首先我们需要找到这个类，我是使用idea按下`ctrl+N`就可以进行搜索

![spring自动配置12](https://gitee.com/zhou-ning/BlogImage/raw/master/java/spring自动配置12.png)

HttpEncodingAutoConfiguration的内容如下：

```java
@Configuration(
    proxyBeanMethods = false
)//表示配置类
@EnableConfigurationProperties({HttpProperties.class})//启动指定类的ConfigurationProperties功能，将配置文件中对应的值和HttpEncodingProperties绑定起来；并把HttpEncodingProperties加入到ioc容器中

@ConditionalOnWebApplication(
    type = Type.SERVLET
)
@ConditionalOnClass({CharacterEncodingFilter.class})
@ConditionalOnProperty(
    prefix = "spring.http.encoding",
    value = {"enabled"},
    matchIfMissing = true
)//判断配置文件中是否存在某个配置 spring.http.encoding.enabled；如果不存在，判断也是成立的，即使我们配置文件中不配置pring.http.encoding.enabled=true，也是默认生效的；
public class HttpEncodingAutoConfiguration {
    private final Encoding properties;
	//只有这一个构造函数
    public HttpEncodingAutoConfiguration(HttpProperties properties) {
        this.properties = properties.getEncoding();
    }

    @Bean
    @ConditionalOnMissingBean
    public CharacterEncodingFilter characterEncodingFilter() {
        CharacterEncodingFilter filter = new OrderedCharacterEncodingFilter();
        filter.setEncoding(this.properties.getCharset().name());
        filter.setForceRequestEncoding(this.properties.shouldForce(org.springframework.boot.autoconfigure.http.HttpProperties.Encoding.Type.REQUEST));
        filter.setForceResponseEncoding(this.properties.shouldForce(org.springframework.boot.autoconfigure.http.HttpProperties.Encoding.Type.RESPONSE));
        return filter;
    }

    @Bean
    public HttpEncodingAutoConfiguration.LocaleCharsetMappingsCustomizer localeCharsetMappingsCustomizer() {
        return new HttpEncodingAutoConfiguration.LocaleCharsetMappingsCustomizer(this.properties);
    }
	... 
}
```

* 注解`@Configuration`，这个在[这里](https://blog.csdn.net/qq_41474648/article/details/105883843)有所讲解，就是给容器中添加组件，也对应了下面的`@Bean`注解

* 注解`@EnableConfigurationProperties({HttpProperties.class})`,作用是启动指定类的`ConfigurationProperties`功能，将配置文件中对应的值和`HttpEncodingProperties`绑定起来；并把`HttpEncodingProperties`加入到ioc容器中，并且我们看到`HttpEncodingAutoConfiguration`只有一个构造函数，就是将`HttpProperties`传入。

* 进入`HttpProperties`中，发现

  ```java
  @ConfigurationProperties(
      prefix = "spring.http"
  )
  public class HttpProperties {
  ...
  }
  ```

  而注解`@ConfigurationProperties`作用就是将配置文件中的内容注入到bean当中，说白了就是通过配置文件对HttpProperties对应的属性进行配置，可以看这个[这个](https://blog.csdn.net/qq_41474648/article/details/105882879)。这就说明了我们可以通过配置文件对HttpProperties进行配置然后影响到HttpEncodingAutoConfiguration这个类

**结论：**

* xxxxAutoConfigurartion：自动配置类，主要负责给给容器中添加组件
* xxxxProperties:封装配置文件中相关属性
* 可以通过在application.properties中编写xxxxProperties的属性从而对xxxxAutoConfigurartion进行一些配置

## 总结

​		springboot的底层帮组我们做了很多的配置，所以现在使用起来springboot比较简单，但是底层的原理还是需要知道一些的，也可以加深的理解。感觉看老师讲的挺好的但是自己来写又说不出来，可能是还是没有理解够吧。