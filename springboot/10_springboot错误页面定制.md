# springboot错误相应定制

## 介绍

在springboot中如果发生访问错误，如404的话，如果是浏览器访问它会给你一个默认的定制页面比如下面这样

![错误页面定制01](https://gitee.com/zhou-ning/BlogImage/raw/master/java/错误页面定制01.png)

如果是其他的，会返回json数据（来自idea插件RestfulToolkit）：

![错误页面定制02](https://gitee.com/zhou-ning/BlogImage/raw/master/java/错误页面定制02.png)

那我们可以定制自己的错误页面吗，答案是肯定的，下面就讲解如何定制自己的错误页面已经信息

## 方法

### 一、定制错误页面

1. 使用了模板引擎情况

   使用了模板引擎thymeleaf的情况下，我们只需要在resources的templates下创建error文件夹，在里面创建以状态码开头的html文件就行，比如：404.html就会对应到404的页面。除此之外，我们可以使用4xx和5xx作为错误页面的文件名来匹配这种类型的所有错误，但是精确优先（优先寻找精确的状态 码.html）。

   举例：

   我们在error文件夹下创建404.html和4xx.html

   ![错误页面定制03](https://gitee.com/zhou-ning/BlogImage/raw/master/java/错误页面定制03.png)

   404.html

   ```html
   <!DOCTYPE html>
   <html lang="en"xmlns:th="http://www.thymeleaf.org">
   <head>
       <meta charset="UTF-8">
       <title>404</title>
   </head>
   <body>
   <h1>status:[[${status}]]</h1>
   <h2>timestamp:[[${timestamp}]]</h2>
   </body>
   </html>	
   ```

   4xx.html

   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <title>4XX</title>
   </head>
   <body>
       <h2>status:[[${status}]]</h2>
   </body>
   </html>
   ```

   结果：

   404：

   ![错误页面定制04](https://gitee.com/zhou-ning/BlogImage/raw/master/java/错误页面定制04.png)

   400错误：

   ![错误页面定制05](https://gitee.com/zhou-ning/BlogImage/raw/master/java/错误页面定制05.png)

2. 没有使用模板引擎

   没有使用模板引擎的话，直接在resources的static下创建error文件夹，然后在里面创建以状态码开头的html文件就行，4xx和5xx在这里面同样生效

### 二、定制错误json数据

为了比较好定制json错误，我们创建一个`UserNotExistException`

```java
public class UserNotExistException extends RuntimeException{
    public UserNotExistException() {
        super("用户不存在");
    }
}
```

然后在`controller`里面加上一个映射

```java
@GetMapping("/exception")
public String toException(){
    throw new UserNotExistException();
}
```

这样当我们访问http://localhost:8080/exception时，就可以发生错误然后有错误页面和数据

定制错误的json数据我们步骤如下：

1. 编写一个`ExceptionHandler` ，加上`@ControllerAdvice`注解，并且编写处理Exception的方法

   ```java
   @ControllerAdvice
   public class MyExceptionHandler {
   
   
       @ExceptionHandler(value = UserNotExistException.class)
       public String handleUserNotExistException(Exception e, HttpServletRequest request){
           Map<String,Object> map = new HashMap<>();
           //传入我们自己的错误状态码 4xx 5xx，否则就不会进入定制错误页面的解析流程
   
           System.out.println("user处理器被执行");
           //需要写错误码，不然默认为200
           request.setAttribute("javax.servlet.error.status_code",401);
           map.put("code","user.notexist");
           map.put("message","user部分发生错误");
           request.setAttribute("ext", map);
           //转发到/error
           return "forward:/error";
       }
   
       @ExceptionHandler(value = Exception.class)
       public String handleException(Exception e, HttpServletRequest request){
           Map<String,Object> map = new HashMap<>();
           //传入我们自己的错误状态码 4xx 5xx，否则就不会进入定制错误页面的解析流程
   
           System.out.println("处理器被执行");
           //需要写错误码，不然默认为200
           request.setAttribute("javax.servlet.error.status_code",500);
           map.put("code","find Exception");
           map.put("message",e.getMessage());
           request.setAttribute("ext", map);
           //转发到/error
           return "forward:/error";
       }
   }
   ```

   可以看到我们将错误设置，然后将错误信息的map放在了request里面

2. 编写`ErrorAttributes`

   ```java
   @Component
   public class MyErrorAttributes extends DefaultErrorAttributes {
       @Override
       public Map<String, Object> getErrorAttributes(WebRequest webRequest, boolean includeStackTrace) {
            
            Map<String, Object> map = super.getErrorAttributes(webRequest,
                   includeStackTrace);
            map.put("name","zhouning");
            Map<String,Object> ext = (Map<String, Object>) webRequest.getAttribute("ext", 0);
            map.put("ext", ext);
            return map;
       }
   }
   ```

   然后在我们编写的`MyErrorAttributes`里面我们可以将上面的map取出来，然后放到父类得到的map中。

3. 最终效果

   ![错误页面定制06](https://gitee.com/zhou-ning/BlogImage/raw/master/java/错误页面定制06.png)

   可以看到我们的信息显示在了上面，并且只有`handleUserNotExistException`做出相应（响应更加精确的错误）。

4. 缺点

   定制json数据的方法其实有很多，比如自己编写一个controller同样可以实现，但是这种方法简洁一些所以推荐使用这种。这个方法的缺点就是无法处理404发生错误的请求，其他的可以，目前除了重新写一个controller我没有想到怎么编写可以处理404错误，知道的人可以指点一下。

## 原理

 上面是举出实际例子，但是光靠例子很难理解，现在主要讲解一下里面的原理。我们需要找到`ErrorMvcAutoConfiguration`这个类

### 1.BasicErrorController

在`ErrorMvcAutoConfiguration`里面我们能够找到添加了`BasicErrorController`

```java
@Bean
@ConditionalOnMissingBean(
    value = {ErrorController.class},
    search = SearchStrategy.CURRENT
)
public BasicErrorController basicErrorController(ErrorAttributes errorAttributes, ObjectProvider<ErrorViewResolver> errorViewResolvers) {
    return new BasicErrorController(errorAttributes, this.serverProperties.getError(), (List)errorViewResolvers.orderedStream().collect(Collectors.toList()));
}
```

然后点进去可以看到具体的实现，可以发现很多东西如下所示（加一些注释上面）：

```java
@Controller
//可以知道映射的位置可以使用server.error.path设置，如果没有设置默认为error.path，error.path没有设置默认为“/error”，这也是前面转发到“/error”的原因
@RequestMapping({"${server.error.path:${error.path:/error}}"})
public class BasicErrorController extends AbstractErrorController {
    private final ErrorProperties errorProperties;

    public BasicErrorController(ErrorAttributes errorAttributes, ErrorProperties errorProperties) {
        this(errorAttributes, errorProperties, Collections.emptyList());
    }

    public BasicErrorController(ErrorAttributes errorAttributes, ErrorProperties errorProperties, List<ErrorViewResolver> errorViewResolvers) {
        super(errorAttributes, errorViewResolvers);
        Assert.notNull(errorProperties, "ErrorProperties must not be null");
        this.errorProperties = errorProperties;
    }

    public String getErrorPath() {
        return this.errorProperties.getPath();
    }
    
	//对要求返回html的处理
    @RequestMapping(
        produces = {"text/html"}
    )
    public ModelAndView errorHtml(HttpServletRequest request, HttpServletResponse response) {
        HttpStatus status = this.getStatus(request);
        //注意这个getErrorAttributes在，下面的方法里面也被掉用了
        Map<String, Object> model = Collections.unmodifiableMap(this.getErrorAttributes(request, this.isIncludeStackTrace(request, MediaType.TEXT_HTML)));
        //设置状态
        response.setStatus(status.value());
        //得到解析后的视图，记住这个resolveErrorView这个方法下面会看到
        ModelAndView modelAndView = this.resolveErrorView(request, response, status, model);
        //如果得到的视图为空，则返回“error”这个视图
        return modelAndView != null ? modelAndView : new ModelAndView("error", model);
    }
    
//对于其他处理，主要会返回json文件
    @RequestMapping
    public ResponseEntity<Map<String, Object>> error(HttpServletRequest request) {
        HttpStatus status = this.getStatus(request);
        if (status == HttpStatus.NO_CONTENT) {
            return new ResponseEntity(status);
        } else {
            //getErrorAttributes被掉用
            Map<String, Object> body = this.getErrorAttributes(request, this.isIncludeStackTrace(request, MediaType.ALL));
            return new ResponseEntity(body, status);
        }
    }
    
	//异常处理
    @ExceptionHandler({HttpMediaTypeNotAcceptableException.class})
    public ResponseEntity<String> mediaTypeNotAcceptable(HttpServletRequest request) {
        HttpStatus status = this.getStatus(request);
        return ResponseEntity.status(status).build();
    }

    protected boolean isIncludeStackTrace(HttpServletRequest request, MediaType produces) {
        IncludeStacktrace include = this.getErrorProperties().getIncludeStacktrace();
        if (include == IncludeStacktrace.ALWAYS) {
            return true;
        } else {
            return include == IncludeStacktrace.ON_TRACE_PARAM ? this.getTraceParameter(request) : false;
        }
    }

    protected ErrorProperties getErrorProperties() {
        return this.errorProperties;
    }
}
```

从上面的解析我们可以看到转发“/error”的原因，以及返回html页面和返回json数据的相应处理。

需要注意的地方：

* `getErrorAttributes`在处理html和json的数据里面都被掉用
* 先使用`resolveErrorView`解析视图，如果没有视图，再返回`ModelAndView("error", model)`;这个视图

### 2.DefaultErrorViewResolver

我们往下翻发现这样的配置

```java
@Configuration(
    proxyBeanMethods = false
)
static class DefaultErrorViewResolverConfiguration {
    private final ApplicationContext applicationContext;
    private final ResourceProperties resourceProperties;

    DefaultErrorViewResolverConfiguration(ApplicationContext applicationContext, ResourceProperties resourceProperties) {
        this.applicationContext = applicationContext;
        this.resourceProperties = resourceProperties;
    }
//DefaultErrorViewResolver视图解析器
    @Bean
    @ConditionalOnBean({DispatcherServlet.class})
    @ConditionalOnMissingBean({ErrorViewResolver.class})
    DefaultErrorViewResolver conventionErrorViewResolver() {
        return new DefaultErrorViewResolver(this.applicationContext, this.resourceProperties);
    }
}
```

我们进进入`DefaultErrorViewResolver`，可以在里面找到这样的方法

```java
//和上面BasicErrorController方法里面掉用的resolveErrorView相呼应
public ModelAndView resolveErrorView(HttpServletRequest request, HttpStatus status, Map<String, Object> model) {
    ModelAndView modelAndView = this.resolve(String.valueOf(status.value()), model);
    if (modelAndView == null && SERIES_VIEWS.containsKey(status.series())) {
        modelAndView = this.resolve((String)SERIES_VIEWS.get(status.series()), model);
    }

    return modelAndView;
}
//解析
private ModelAndView resolve(String viewName, Map<String, Object> model) {
    //从error/下找对应的视图，解释了为什么404.html要放在“error/”文件夹下
    String errorViewName = "error/" + viewName;
    //模板引擎解析
    TemplateAvailabilityProvider provider = this.templateAvailabilityProviders.getProvider(errorViewName, this.applicationContext);
    //如果provider不为null，直接返回模板引擎解析的，如果为null在进行resolveResource
    return provider != null ? new ModelAndView(errorViewName, model) : this.resolveResource(errorViewName, model);
}

private ModelAndView resolveResource(String viewName, Map<String, Object> model) {
   //从静态资源下
    String[] var3 = this.resourceProperties.getStaticLocations();
    int var4 = var3.length;

    for(int var5 = 0; var5 < var4; ++var5) {
        String location = var3[var5];

        try {
            Resource resource = this.applicationContext.getResource(location);
            resource = resource.createRelative(viewName + ".html");
            if (resource.exists()) {
                return new ModelAndView(new DefaultErrorViewResolver.HtmlResourceView(resource), model);
            }
        } catch (Exception var8) {
        }
    }
	//从国静态资里面也没有，则返回null
    return null;
}
```

这部分和上面相呼应，也就解释了为啥文件放在error/文件夹下。

需要注意的点：

* 视图解析时有模板引擎，先使用模板引擎解析视图，如果模板引擎解析出来为null，再从静态资源里面解析，如果静态资源里面都为null，那么就返回null。这也对应了`BasicErrorController`中最终可能`ModelAndView("error", model)`



### 3.WhitelabelErrorViewConfiguration

上面看到了`ModelAndView("error", model)`这个视图但是不知道是什么样，我在`ErrorMvcAutoConfiguration`里面找到了这个

```java
@Configuration(
    proxyBeanMethods = false
)
@ConditionalOnProperty(
    prefix = "server.error.whitelabel",
    name = {"enabled"},
    matchIfMissing = true
)
@Conditional({ErrorMvcAutoConfiguration.ErrorTemplateMissingCondition.class})
protected static class WhitelabelErrorViewConfiguration {
    //就是他error视图
    private final ErrorMvcAutoConfiguration.StaticView defaultErrorView = new ErrorMvcAutoConfiguration.StaticView();

    protected WhitelabelErrorViewConfiguration() {
    }
	
    //error视图在这里
    @Bean(
        name = {"error"}
    )
    @ConditionalOnMissingBean(
        name = {"error"}
    )
    public View defaultErrorView() {
        return this.defaultErrorView;
    }

    @Bean
    @ConditionalOnMissingBean
    public BeanNameViewResolver beanNameViewResolver() {
        BeanNameViewResolver resolver = new BeanNameViewResolver();
        resolver.setOrder(2147483637);
        return resolver;
    }
}
```

然后我们找到`StaticView`

```java
private static class StaticView implements View {
    //渲染，原本html的原型
     public void render(Map<String, ?> model, HttpServletRequest request, HttpServletResponse response) throws Exception {
                if (response.isCommitted()) {
                    String message = this.getMessage(model);
                    logger.error(message);
                } else {
                    response.setContentType(TEXT_HTML_UTF8.toString());
                    StringBuilder builder = new StringBuilder();
                    Date timestamp = (Date)model.get("timestamp");
                    Object message = model.get("message");
                    Object trace = model.get("trace");
                    if (response.getContentType() == null) {
                        response.setContentType(this.getContentType());
                    }

                    builder.append("<html><body><h1>Whitelabel Error Page</h1>").append("<p>This application has no explicit mapping for /error, so you are seeing this as a fallback.</p>").append("<div id='created'>").append(timestamp).append("</div>").append("<div>There was an unexpected error (type=").append(this.htmlEscape(model.get("error"))).append(", status=").append(this.htmlEscape(model.get("status"))).append(").</div>");
                    if (message != null) {
                        builder.append("<div>").append(this.htmlEscape(message)).append("</div>");
                    }

                    if (trace != null) {
                        builder.append("<div style='white-space:pre-wrap;'>").append(this.htmlEscape(trace)).append("</div>");
                    }

                    builder.append("</body></html>");
                    response.getWriter().append(builder.toString());
                }
            }
}
```

我们找到了原本html的原型

### 4.DefaultErrorAttributes

我们在`BasicErrorController`中看到`resolve`和`resolveResource`方法里面都掉用了`getErrorAttributes`这个方法得到信息，我们点进去，发现父类`AbstractErrorController`里面是这样的

```java
protected Map<String, Object> getErrorAttributes(HttpServletRequest request, boolean includeStackTrace) {
    WebRequest webRequest = new ServletWebRequest(request);
    return this.errorAttributes.getErrorAttributes(webRequest, includeStackTrace);
}
```

我们找到这个`errorAttributes`发现是这样的`private final ErrorAttributes errorAttributes`

然后我们在`ErrorMvcAutoConfiguration`里面找到`DefaultErrorAttributes`

```java
//当这个容器中存在ErrorAttributes时，在容器中添加DefaultErrorAttributes
@Bean
@ConditionalOnMissingBean(
    value = {ErrorAttributes.class},
    search = SearchStrategy.CURRENT
)
public DefaultErrorAttributes errorAttributes() {
    return new DefaultErrorAttributes(this.serverProperties.getError().isIncludeException());
}
```

点进去，发现它实现的就是`ErrorAttributes`

```java
public class DefaultErrorAttributes implements ErrorAttributes, HandlerExceptionResolver, Ordered {
    //实现
     public Map<String, Object> getErrorAttributes(WebRequest webRequest, boolean includeStackTrace) {
            Map<String, Object> errorAttributes = new LinkedHashMap();
            errorAttributes.put("timestamp", new Date());
            this.addStatus(errorAttributes, webRequest);
            this.addErrorDetails(errorAttributes, webRequest, includeStackTrace);
            this.addPath(errorAttributes, webRequest);
            return errorAttributes;
        }
}
```

也就是说在`BasicErrorController`掉用的方法`getErrorAttributes`默认是`DefaultErrorAttributes`，而当我们实现一个`ErrorAttributes`并切添加进容器时，默认就不会添加`DefaultErrorAttributes`，而使用我们实现的这个类，这也是为什么我们自定义数据继承了`DefaultErrorAttributes`。



## 总结

 		当我们springboot出现异常比如404、503等，BasicErrorController会对这些错误进行反应，返回对应的html或者json，`BasicErrorController`返回html时，是通过`DefaultErrorViewResolver`进行视图解析，当解析返回null时，掉用系统自带的`StaticView`，而`BasicErrorController`的数据信息来源则是由`DefaultErrorAttributes`进行提供。

​		以上都是一些我自己的理解，如果有错误的地方欢迎指出来，一起学习。



