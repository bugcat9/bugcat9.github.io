# springboot当中整合Druid

## 简介

jdbc是连接数据库的基础，springboot当中也可以直接使用jdbc进行相应的访问，并且在学习当中springboot整合jdbc过程中学习了一下Druid，所以记录一下。

## 讲解

### 1.jdbc配置

使用jdbc我们需要在application.yml或者application.properties进行配置,我使用的是mysql，配置如下，其中springboot是对应的数据库

```yaml
spring:
  datasource:
    username: root
    password: 123456
    url: jdbc:mysql://127.0.0.1:3306/springboot
    driver-class-name: com.mysql.jdbc.Driver
```



### 2.自动建表

springboot中可以程序运行的时候运行建表和插入数据的sql语句，具体内容在`DataSourceInitializer`当中

```java
boolean createSchema() {
    //调用了getScripts
    List<Resource> scripts = this.getScripts("spring.datasource.schema", this.properties.getSchema(), "schema");
    if (!scripts.isEmpty()) {
        if (!this.isEnabled()) {
            logger.debug("Initialization disabled (not running DDL scripts)");
            return false;
        }

        String username = this.properties.getSchemaUsername();
        String password = this.properties.getSchemaPassword();
        //运行脚本
        this.runScripts(scripts, username, password);
    }

    return !scripts.isEmpty();
}

void initSchema() {
     //调用了getScripts
    List<Resource> scripts = this.getScripts("spring.datasource.data", this.properties.getData(), "data");
    if (!scripts.isEmpty()) {
        if (!this.isEnabled()) {
            logger.debug("Initialization disabled (not running data scripts)");
            return;
        }

        String username = this.properties.getDataUsername();
        String password = this.properties.getDataPassword();
        //运行脚本
        this.runScripts(scripts, username, password);
    }

}

 private List<Resource> getScripts(String propertyName, List<String> resources, String fallback) {
        if (resources != null) {
            return this.getResources(propertyName, resources, true);
        } else {
            //这里得到platform
            String platform = this.properties.getPlatform();
            List<String> fallbackResources = new ArrayList();
            //platform默认为all,可以点进去看
            fallbackResources.add("classpath*:" + fallback + "-" + platform + ".sql");
            fallbackResources.add("classpath*:" + fallback + ".sql");
            return this.getResources(propertyName, fallbackResources, false);
        }
    }
```

总结规则就是默认运行schema.sql，schema‐all.sql，data.sql,data-all.sql脚本，但是也可以通过自定进行配置，如在apllication.yml中进行配置:

![](https://gitee.com/zhou-ning/BlogImage/raw/master/java/springboot-jdbc01.png)

```yaml
spring:
  datasource:
    username: root
    password: 123456
    url: jdbc:mysql://127.0.0.1:3306/springboot
    driver-class-name: com.mysql.jdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource
    initialization-mode: always
    schema:
      - classpath:sql/department.sql
```

其中`initialization-mode: always`在springboot2中需要进行设置，它有三种选项

```java
public enum DataSourceInitializationMode {
    ALWAYS,//每次
    EMBEDDED,//仅嵌入式数据源时使用
    NEVER;//从不

    private DataSourceInitializationMode() {
    }
}
```

遇到的问题：

`Property spring.datasource.schema with value 'class path resource [department.sql]' is invalid: The specified resource does not exist.`

我开始将department.sql直接放在resources目录下检测不到department.sql的存在，最终没有办法才创建了sql文件夹，放在下面



最终效果：

![](https://gitee.com/zhou-ning/BlogImage/raw/master/java/springboot-jdbc02.png)



### 3.整合Druid数据源

Druid是阿里巴巴开源的一个数据源，主要用于java数据库连接池，可以后台对sql进行监控，是目前使用比较多的数据源之一

首先我们需要去maven仓库搜索出对应的依赖，进行加入

```xml
<!-- https://mvnrepository.com/artifact/com.alibaba/druid -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.1.21</version>
</dependency>
```

在application.yml中的配置

```yaml
spring:
  datasource:
    username: root
    password: 123456
    url: jdbc:mysql://127.0.0.1:3306/springboot
    driver-class-name: com.mysql.jdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource
    schema:
      - classpath:sql/department.sql
    initialization-mode: always

    initialSize: 5
    minIdle: 5
    maxActive: 20
    maxWait: 60000
    timeBetweenEvictionRunsMillis: 60000
    minEvictableIdleTimeMillis: 300000
    validationQuery: SELECT 1 FROM DUAL
    testWhileIdle: true
    testOnBorrow: false
    testOnReturn: false
    poolPreparedStatements: true
    #   配置监控统计拦截的filters，去掉后监控界面sql无法统计，'wall'用于防火墙
    filters: stat,wall,logback
    maxPoolPreparedStatementPerConnectionSize: 20
    useGlobalDataSourceStat: true
    connectionProperties: druid.stat.mergeSql=true;druid.stat.slowSqlMillis=500
```

编写配置文件

```java
@Configuration
public class DruidConfig {
    @ConfigurationProperties(prefix = "spring.datasource")
    @Bean
    public DataSource druid(){
        return new DruidDataSource();
    }

    /**
     *  配置一个管理后台的Servlet
     *
     */
    @Bean
    public ServletRegistrationBean statViewServlet(){
        ServletRegistrationBean bean = new ServletRegistrationBean(new StatViewServlet(),
                "/druid/*");
        Map<String,String> initParams = new HashMap<>();
        initParams.put("loginUsername","admin");
        initParams.put("loginPassword","123456");
        //默认就是允许所有访问
        initParams.put("allow","");
        initParams.put("deny","192.168.15.21");
        bean.setInitParameters(initParams);
        return bean;
    }

    /**
     * 配置一个web监控的filter
     */
    @Bean
    public FilterRegistrationBean webStatFilter(){
        FilterRegistrationBean bean = new FilterRegistrationBean();
        bean.setFilter(new WebStatFilter());
        Map<String,String> initParams = new HashMap<>();
        initParams.put("exclusions","*.js,*.css,/druid/*");
        bean.setInitParameters(initParams);
        bean.setUrlPatterns(Arrays.asList("/*"));
        return bean;
    }

}
```

然后我们就可以以在

http://localhost:8080/druid进行后台登录然后进行查看

比如我在代码当中对建的department表进行查询，在sql监控上可以看到

![](https://gitee.com/zhou-ning/BlogImage/raw/master/java/springboot-jdbc03.png)

## 总结

学习jdbc是学习springboot数据访问当中的基础，继续学习加油。