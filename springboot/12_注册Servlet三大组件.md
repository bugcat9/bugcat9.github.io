# 注册Servlet三大组件

## 简介

Servlet三大组件Servlet、Filter、Listener我们听说的比较多，在springboot当中也可以添加这三大组件，使用起来也比较方便

## 讲解

### 编写三大组件

添加三大组件之前我们需要先编写三大组件

MyServlet：

```java
public class MyServlet extends HttpServlet {

    /**
     * 处理get请求
     * @param req
     * @param resp
     * @throws ServletException
     * @throws IOException
     */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        System.out.println("MyServlet 被调用");
        resp.getWriter().write("Hello MyServlet");
    }

    /**
     * 处理post请求
     * @param req
     * @param resp
     * @throws ServletException
     * @throws IOException
     */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        System.out.println("MyServlet 被调用");
        resp.getWriter().write("Hello MyServlet");
    }
}
```

MyFilter：

```java
public class MyFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {

    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        System.out.println("MyFilter 被调用");
        chain.doFilter(request,response);

    }

    @Override
    public void destroy() {

    }
}
```

MyListener：

```java
public class MyListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        System.out.println("contextInitialized...web应用启动");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        System.out.println("contextDestroyed...当前web项目销毁");
    }
}
```

### 进行相应的配置

servlet要添加进容器需要以ServletRegistrationBean的形式，fliter要添加进容器需要以FilterRegistrationBean的形式，Listener添加进容器需要以ServletListenerRegistrationBean的形式

```java
/**
 * 配置三大组件
 *
 * @author zhouning
 */
@Configuration
public class MyServerConfig {

    @Bean
    public ServletRegistrationBean myServlet(){
        //和 “/myServlet”想映射
        ServletRegistrationBean registrationBean = new ServletRegistrationBean(new MyServlet(),"/myServlet");
        registrationBean.setLoadOnStartup(1);
        return registrationBean;
    }

    @Bean
    public FilterRegistrationBean myFilter(){
        FilterRegistrationBean registrationBean = new FilterRegistrationBean();
        registrationBean.setFilter(new MyFilter());
        //对于 “/hello”，“/myServlet”进行拦截
        registrationBean.setUrlPatterns(Arrays.asList("/hello","/myServlet"));
        return registrationBean;
    }

    @Bean
    public ServletListenerRegistrationBean myListener(){
        //
        ServletListenerRegistrationBean<MyListener> registrationBean = new ServletListenerRegistrationBean<>(new MyListener());
        return registrationBean;
    }

}
```

### 最终效果

访问http://localhost:8080/hello和http://localhost:8080/myServlet

![](https://gitee.com/zhou-ning/BlogImage/raw/master/java/servlet三大组件.png)

## 总结

springboot继续学习当中