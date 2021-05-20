# springboot中restfulCRUD例子

## 简介

在学习了springboot和web相关的内容时，学习了一下增删改查相关的讲解，所以自己也写一个增删改查的例子来记录一下,先说明为了简单本次例子中不含有数据库相关的操作，只是为了举例。



## 讲解

假设我们有一个学生类student需要进行展示，并且对其进行增删改查。

首先我们写一下对应的uri:

|      | 普通CRUD（uri来区分操作） | RestfulCRUD          |
| ---- | ------------------------- | -------------------- |
| 查询 | getStudent                | student--get         |
| 添加 | addStudent                | student--post        |
| 修改 | updateStudent             | student/{id}--put    |
| 删除 | deleteStudent             | student/{id}--delete |

大致的过程：

| 实验功能                     | 请求URI      | 请求方式 |
| ---------------------------- | ------------ | -------- |
| 查询所有学生                 | students     | get      |
| 查询某个学生或者修改某个学生 | student/{id} | get      |
| 到添加界面                   | student      | get      |
| 添加学生                     | student      | post     |
| 修改学生                     | student      | put      |
| 删除学生                     | student/{id} | delete   |

先展示一下写完后的目录情况

![crud例子01](https://gitee.com/zhou-ning/BlogImage/raw/master/java/crud例子01.png)

### 一、编写Student、StudentDao

student类为了简单就只有姓名和学号

```java
package com.zhouning.entities;

/**
 * 学生
 *
 * @author zhouning
 */
public class Student {
    /**
     * 姓名
     */
    private String name;

    /**
     * 学号，学号作为标识，不能相同
     */
    private Integer sno;

    public Student() {}

    public Student(String name, Integer sno) {
        this.name = name;
        this.sno = sno;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getSno() {
        return sno;
    }

    public void setSno(Integer sno) {
        this.sno = sno;
    }


    @Override
    public String toString() {
        return "Student{" +
                "name='" + name + '\'' +
                ", sno=" + sno +
                '}';
    }
}
```

StudentDao类就有数据里面的增删改查，因为没有和数据库发生交互，所以也是比较简单的

```java
@Repository
public class StudentDao {
    private static Map<Integer, Student> students = null;

    static {
        students = new HashMap<>();
        students.put(101, new Student("张三",101));
        students.put(102, new Student("李四",102));
        students.put(103, new Student("王五",103));
        students.put(104, new Student("赵六",104));
    }

    private static Integer initSno = 1006;
    public void save(Student student){
        if (student.getSno()==null){
            student.setSno(initSno++);
        }
        students.put(student.getSno(), student);
    }

    public Collection<Student> getAll(){
        return students.values();
    }

    public Student get(Integer sno){
        return students.get(sno);
    }

    public void delete(Integer sno){
        students.remove(sno);
    }

}
```

### 二、展示界面list.html

list.html实现比较简单主要功能是将学生以及有一些按按钮或者超链接进行访问都展示出来，使用了thymeleaf模板引擎

```html
<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>所有学生</title>
</head>
<body>
    <table border="1">
<!--        头部-->
        <thead>
            <tr>
                <th>学号</th>
                <th>姓名</th>
                <th>操作</th>
            </tr>
        </thead>

<!--        身体-->
        <tbody>
            <tr th:each="student:${students}">
                <td th:text="${student.getSno()}">row 1, cell 1</td>
                <td th:text="${student.getName()}">row 1, cell 2</td>
                <td>
                    <a th:href="@{/student/}+${student.getSno()}" >编辑</a>

                    <form action="test" th:action="@{/student/}+${student.getSno()}" method="post">
                        <input type="hidden"  name="_method" value="delete">
                        <input type="submit" value="删除"></input>
                    </form>

                </td>
            </tr>
        </tbody>
    </table>

    <h2><a href="/student" >添加员工</a></h2>

</body>



</html>
```

比较简单使用get请求得到所有的学生

```java
/**
 * 查找所有人
 * @param model
 * @return
 */
@GetMapping("/students")
public String list(Model model){
    Collection<Student> students = studentDao.getAll();
    System.out.println(students);
    //放在请求域中
    model.addAttribute("students", students);
    return "student/list";
}
```

访问的结果是这样：

![crud例子02](https://gitee.com/zhou-ning/BlogImage/raw/master/java/crud例子02.png)

可以看到有编辑、删除、添加员工几个操作

### 三、添加员工操作

可以看到lsit.html里面有一个`<h2><a href="/student" >添加员工</a></h2>`,就是说`/student`转到添加员工页面。所以我们编写一个添加add.html进行员工添加

```html
<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>编辑页面</title>
</head>
<body>
<form method="post" action="/student">
    学号: <input type="number" name="sno" ><br>
    姓名: <input type="text" name="name" ><br>
    <input type="submit" value="提交">
</form>
</body>
</html>
```

对应的映射内容

```java
/**
 * 到添加页面
 * @return
 */
@GetMapping("/student")
public String toAddPage(){
    return "student/add";
}
```

效果：

![crud例子03](https://gitee.com/zhou-ning/BlogImage/raw/master/java/crud例子03.png)

当我们填好信息按下时，可以发送了一个post请求，将我们添加的东西发送过去，对应的映射处理

```java
 /**
  * 添加学生
  * @param student
  * @return
  */
 @PostMapping("/student")
public String addStudent(Student student){
     System.out.println(student);
     studentDao.save(student);
     return "redirect:/students";
}
```

这里进行重定向，到学生展示页面，效果：

![crud例子04](https://gitee.com/zhou-ning/BlogImage/raw/master/java/crud例子04.png)

### 四、修改信息

我们可以看到list.html当中有这样的语句`<a th:href="@{/student/}+${student.getSno()}" >编辑</a>`,跳转到修改信息的页面。所以编写了一个update.html页面

```html
<!DOCTYPE html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>编辑页面</title>
</head>
<body>
    <form method="post" action="/student">
        <input type="hidden" name="_method" value="put"/>
        学号: <input type="number" name="sno" th:value="${student.getSno()}"><br>
        姓名: <input type="text" name="name" th:value="${student.getName()}"><br>
        <input type="submit" value="提交">
    </form>
</body>
</html>
```

对应的映射

```java
/**
 * 查找或者修改一个人
 * @param sno
 * @param model
 * @return
 */
@GetMapping("/student/{sno}")
public String toUpdataPage(@PathVariable(value = "sno")Integer sno,Model model){
    Student student = studentDao.get(sno);
    model.addAttribute("student", student);
    return "student/update";
}
```

并且我们会将学生的信息传过去，方便进行回显，比如我们点击zhouning那行的编辑，效果

![crud例子05](https://gitee.com/zhou-ning/BlogImage/raw/master/java/crud例子05.png)

这里我们按下提交按钮可以发送post请求，但是springboot会解析成put请求，因为` <input type="hidden" name="_method" value="put"/>`的原因，学过springmvc的应该知道，在springboot里面底层帮我们自动解析了。

对应的映射处理

```java
/**
 * 修改学生
 * @param student
 * @return
 */
@PutMapping("/student")
public String updateStudent(Student student){
    System.out.println(student);
    studentDao.save(student);
    return "redirect:/students";
}
```

我们将zhouning的学号改成zn，不能修改学号因为学号唯一标识，并且代码里面可以看到修改学号就会产生加一个学生的效果，这里是举例，所以不深究，最终效果：

![crud例子06](https://gitee.com/zhou-ning/BlogImage/raw/master/java/crud例子06.png)

### 五、删除学生

我们看到list.html里面删除是这样的

```html
 <form action="test" th:action="@{/student/}+${student.getSno()}" method="post">
                        <input type="hidden"  name="_method" value="delete">
                        <input type="submit" value="删除"></input>
                    </form>
```

经过上面的修改可以知道这是为了发送post请求解析成delete请求

对应的映射处理

```java
@DeleteMapping("/student/{sno}")
public String deleteStudent(@PathVariable(value = "sno")Integer sno){
    System.out.println(sno);
    studentDao.delete(sno);
    return "redirect:/students";
}
```

### 六、其他

在springboot2.xxx里面，将post解析成put和delete并不会自动配置，需要我们在application.properties里面写上这个

```properties
spring.mvc.hiddenmethod.filter.enabled=true
```

另外我还配置了一个configer，方便一开始就进入list.html

```java
package com.zhouning.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * @author zhouning
 */
@Configuration
public class MyConfigurer implements WebMvcConfigurer {
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("redirect:students");
        registry.addViewController("/index").setViewName("redirect:students");
        registry.addViewController("/main.html").setViewName("redirect:students");
    }
}
```

## 总结

学习了springboot的crud自己写一下还是蛮不错的，源码在这里：[源码传送门](https://github.com/zhou-ning/springboot-crud)。