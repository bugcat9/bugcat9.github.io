# springboot拦截器小例子

## 简介

拦截器顾名思义就是拦截一些请求达到我们想要的目的，在这里我写了一个简单的拦截器小例子记录一下。

## 讲解

假设我们有这样一个需求，需要系统在登录之后才能使用其他功能，如果没有登录就访问其他请求就强制返回登录页面。对于这个请求我们可以通过拦截器进行实现，拦截系统访问，判断是否已经登录，如果没有登录，则返回到登录界面。

### 1.登录功能编写

既然有登录那我们需要先编写登录

登录界面login.html

```HTML
<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>登录</title>
</head>
<body>
<form method="post" action="/login">
    <p style="color: red" th:text="${msg}" th:if="${not #strings.isEmpty(msg)}"></p>
    用户名: <input type="text" name="username" ><br>
    密码: <input type="text" name="password" ><br>
    <input type="submit" value="登录">
</form>
</body
</html>
```

登录对应的请求

```java
@PostMapping("/login")
public String login(@RequestParam(value = "username") String username,
                    @RequestParam(value = "password") String password,
                    Map<String,Object> map, HttpSession session){
    if (!StringUtils.isEmpty(username)&&"123456".equals(password)){
        //放在session当中，用于判断是否登录
        sessionda.setAttribute("loginUser", username);
        //登录成功,防止表单重复提交，进行重定向
        return "redirect:/main.html";
    }else {
        map.put("msg", "用户名或者密码错误");
        return "login";
    }
}

@GetMapping("/hello")
@ResponseBody
public String hello(){
    return "hello world";
}
```

这里我们假设密码为123456就通过。这时的效果是这样

![](https://gitee.com/zhou-ning/BlogImage/raw/master/java/拦截器小例子01.png)

![](https://gitee.com/zhou-ning/BlogImage/raw/master/java/拦截器小例子02.png)

但是此时如果我们没有登录成功一样可以访问后台的其他功能，比如：我们访问写好的:http://localhost:8080/hello,可以得到

![](https://gitee.com/zhou-ning/BlogImage/raw/master/java/拦截器小例子03.png)

这不是我们想要的结果

### 2.添加拦截器

这个时候我们可以添加一个拦截器

```java
public class LoginHandlerIntercep implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        Object user = request.getSession().getAttribute("loginUser");
        if (user==null){
            //未登录，返回登录页面
            request.setAttribute("msg", "请先登录");
            request.getRequestDispatcher("/").forward(request, response);
            return false;
        }else {
            //进行了登录
            return true;
        }
    }
}
```

这个拦截器从Session当中获得我们登录的对象，进行判断，如果没有对象为null则返回登录界面。其中Session的对象是我们登录的时候放进去的，可以看到上面登录代码里面是有体现的。

光是编写拦截器并不够，我们需要将拦截器添加到进行配置当中，我采用的方法是自己编写一个配置

```java
@Configuration
public class MyConfigurer implements WebMvcConfigurer {
    /**
     * 视图映射
     * @param registry
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("login");
        registry.addViewController("/index").setViewName("login");
        registry.addViewController("/main.html").setViewName("redirect:students");
    }

    /**
     * 添加拦截器
     * @param registry
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // addPathPatterns表示对请求进行拦截，excludePathPatterns表示除了()请求之外
        registry.addInterceptor(new LoginHandlerIntercep()).addPathPatterns("/**").
                excludePathPatterns("/index.html","/","/login");
    }
}
```

可以看拦截中对于“/**”进行拦截，意思是对于所有请求进行拦截，而excludePathPatterns("/index.html","/","/login")则是除了除了主页面和登录请求之外，因为需要访问主页面和发送登录请求才能进行登录。总和起来就是除了主页面和登录请求之外，其他请求的欧进行拦截。

如果这时候我们还访问http://localhost:8080/hello，结果是这样

![](https://gitee.com/zhou-ning/BlogImage/raw/master/java/拦截器小例子04.png)

## 总结

拦截器内容比较简单，就写这么多后面学习到了更多再进行补充