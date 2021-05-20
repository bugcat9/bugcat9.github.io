# thymeleaf语法简单记录

## 简介

学习springboot的时候学习了一下thymeleaf的语法，所以拿来记录一下啊，主要参考了[官方的文档](https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html#introducing-thymeleaf)

## 学习语法规则

thymeleaf在使用的时候我们首先需要在开头导入名称空间

```html
<html lang="en" xmlns:th="http://www.thymeleaf.org">
```

下面这张表是在thymeleaf官方文档里面所找到的，thymeleaf的属性优先级，也是类似于所有属性的大纲，所有写在开头

| Order | Feature                         | Attributes                                                  |
| :---- | :------------------------------ | :---------------------------------------------------------- |
| 1     | Fragment inclusion              | `th:insert` `th:replace`（片段包含）                        |
| 2     | Fragment iteration              | `th:each`（遍历）                                           |
| 3     | Conditional evaluation          | `th:if` `th:unless` `th:switch` `th:case`（判断）           |
| 4     | Local variable definition       | `th:object` `th:with`（声明变量）                           |
| 5     | General attribute modification  | `th:attr` `th:attrprepend` `th:attrappend`（属性修改）      |
| 6     | Specific attribute modification | `th:value` `th:href` `th:src` `...`（修改指定属性）         |
| 7     | Text (tag body modification)    | `th:text` `th:utext`（修改标签体的内容，其中utext为不转义） |
| 8     | Fragment specification          | `th:fragment`（声明片段）                                   |
| 9     | Fragment removal                | `th:remove`                                                 |

### 1.表达式

thymeleaf的表达式主要有5个，如下所示

* Variable Expressions: `${...}`

  变量表达式应该是使用的最广的表达式，主要使用是三个方法

  * 获取对象的属性、调用方法

    ```java
    /*
     * Access to properties using the point (.). Equivalent to calling property getters.通过(.)来获取属性
     */
    ${person.father.name}
    
    /*
     * Access to properties can also be made by using brackets ([]) and writing 
     * the name of the property as a variable or between single quotes.也可以通过[]进行访问
     */
    ${person['father']['name']}
    
    /*
     * If the object is a map, both dot and bracket syntax will be equivalent to 
     * executing a call on its get(...) method.map类型也支持
     */
    ${countriesByCode.ES}
    ${personsByName['Stephen Zucchini'].age}
    
    /*
     * Indexed access to arrays or collections is also performed with brackets, 
     * writing the index without quotes.数组类型
     */
    ${personsArray[0].name}
    
    /*
     * Methods can be called, even with arguments.也可以掉用方法
     */
    ${person.createCompleteName()}
    ${person.createCompleteNameWithSeparator('-')}
    ```

  * 使用内置的基本对象

    支持内置的基本对象的一些使用,如：上下文、上下文变量但是得使用＃符号开头进行引用

    ```properties
    #ctx: the context object.
    #vars: the context variables.
    #locale: the context locale.
    #request: (only in Web Contexts) the HttpServletRequest object.
    #response: (only in Web Contexts) the HttpServletResponse object.
    #session: (only in Web Contexts) the HttpSession object.
    #servletContext: (only in Web Contexts) the ServletContext object.
    ```

    例子：查看国家

    ```html
    Established locale country: <span th:text="${#locale.country}">US</span>.
    ```

    更多情况可以看[附录](https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html#appendix-a-expression-basic-objects)

  * 使用表达工具对象

    内置的工具和上面的基本对象用法一样，使用＃符号开头进行引用，可以看到这些都是一些方法

    ```properties
    #execInfo: information about the template being processed.
    #messages: methods for obtaining externalized messages inside variables expressions, in the same way as they would be obtained using #{…} syntax.
    #uris: methods for escaping parts of URLs/URIs
    #conversions: methods for executing the configured conversion service (if any).
    #dates: methods for java.util.Date objects: formatting, component extraction, etc.
    #calendars: analogous to #dates, but for java.util.Calendar objects.
    #numbers: methods for formatting numeric objects.
    #strings: methods for String objects: contains, startsWith, prepending/appending, etc.
    #objects: methods for objects in general.
    #bools: methods for boolean evaluation.
    #arrays: methods for arrays.
    #lists: methods for lists.
    #sets: methods for sets.
    #maps: methods for maps.
    #aggregates: methods for creating aggregates on arrays or collections.
    #ids: methods for dealing with id attributes that might be repeated (for example, as a result of an iteration).
    ```

    例子：进行日期格式化

    ```html
    <p>
      Today is: <span th:text="${#calendars.format(today,'dd MMMM yyyy')}">13 May 2011</span>
    </p>
    ```

    更多情况可以看[附录](https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html#appendix-b-expression-utility-objects)

* Selection Variable Expressions: `*{...}`

  选择表达式功能上和其实和变量表达式一样，唯一的区别是星号语法`*{...}`

  在选定对象后，星号语法代表的是对象，而不是整个上下文上评估表达式，也就是说，只要没有选定的对象，美元和星号的语法就完全一样。那什么是选定对象呢，看下面一个例子：

  选择对象就是使用`th:object`创造一个变量

  ```html
   <div th:object="${session.user}">
      <p>Name: <span th:text="*{firstName}">Sebastian</span>.</p>
      <p>Surname: <span th:text="*{lastName}">Pepper</span>.</p>
      <p>Nationality: <span th:text="*{nationality}">Saturn</span>.</p>
    </div>
  ```

  上面的用法和下面这种只用`${...}`是相同的

  ```html
  <div>
    <p>Name: <span th:text="${session.user.firstName}">Sebastian</span>.</p>
    <p>Surname: <span th:text="${session.user.lastName}">Pepper</span>.</p>
    <p>Nationality: <span th:text="${session.user.nationality}">Saturn</span>.</p>
  </div>
  ```

  当然和上面说的一样，如果没有选定对象`*{...}`和`${...}`相同，也可以这样

  ```html
  <div>
    <p>Name: <span th:text="*{session.user.name}">Sebastian</span>.</p>
    <p>Surname: <span th:text="*{session.user.surname}">Pepper</span>.</p>
    <p>Nationality: <span th:text="*{session.user.nationality}">Saturn</span>.</p>
  </div>
  ```

  并且选择对象后，选定的对象也可以作为`#object`表达式变量用于`${...}`

  ```html
  <div th:object="${session.user}">
    <p>Name: <span th:text="${#object.firstName}">Sebastian</span>.</p>
    <p>Surname: <span th:text="${session.user.lastName}">Pepper</span>.</p>
    <p>Nationality: <span th:text="*{nationality}">Saturn</span>.</p>
  </div>
  ```

* Message Expressions: `#{...}`

  消息表达式多用于国际化的时候使用，这里暂时留个坑用到具体的例子再填

* Link URL Expressions: `@{...}`

  链接表达式就是对html当中的链接进行替换使用的，需要使用`th:href`进行赋值,直接看例子

  ```html
  <!-- Will produce 'http://localhost:8080/gtvg/order/details?orderId=3' (plus rewriting) -->
  <a href="details.html" 
     th:href="@{http://localhost:8080/gtvg/order/details(orderId=${o.id})}">view</a>
  
  <!-- Will produce '/gtvg/order/details?orderId=3' (plus rewriting) -->
  <a href="details.html" th:href="@{/order/details(orderId=${o.id})}">view</a>
  
  <!-- Will produce '/gtvg/order/3/details' (plus rewriting) -->
  <a href="details.html" th:href="@{/order/{orderId}/details(orderId=${o.id})}">view</a>
  ```

  从上面的例子可以看出`th:href`主要替换`<a>`标签当中的`href`属性，并且在表达式里面可以使用另一个表达式的计算结果。另外可以使用其他语法来创建相对于服务器根目录的URL（而不是上下文根目录的URL），以便链接到同一服务器中的不同上下文。这些网址将指定为`@{~/path/to/something}`

  

* Fragment Expressions: `~{...}`

  这个后面填坑


表达式是大致为五种，表达式里面的值和运算也可以是多种多样的也有几种，如下：

- Literals

  字面量，可以是字符串、数字、布尔类型

  - Text literals: `'one text'`, `'Another one!'`,…
  - Number literals: `0`, `34`, `3.0`, `12.3`,…
  - Boolean literals: `true`, `false`
  - Null literal: `null`
  - Literal tokens: `one`, `sometext`, `main`,…

  ```html
  <p>The year is <span th:text="2013">1492</span>.</p>
  <p>In two years, it will be <span th:text="2013 + 2">1494</span>.</p>
  ```

- Text operations:

  文本操作

  - String concatenation: `+`

    ```html
    <span th:text="'The name of the user is ' + ${user.name}">
    ```

  - Literal substitutions: `|The name is ${name}|`

    这个Literal substitutions允许很简单格式化包含变量值的字符串，而无需在文本后加上'...'+'...'

    ```html
    <span th:text="|Welcome to our application, ${user.name}!|">
    ```

    等同于

    ```html
    <span th:text="'Welcome to our application, ' + ${user.name} + '!'">
    ```

    并且只有`${...}`, `*{...}`, `#{...}`才能使用`|...|`这种用法

- Arithmetic operations:

  数学运算

  - Binary operators: `+`, `-`, `*`, `/`, `%`
  - Minus sign (unary operator): `-`

  ```html
  <div th:with="isEven=(${prodStat.count} % 2 == 0)">
  ```

- Boolean operations:

  布尔运算

  - Binary operators: `and`, `or`
  - Boolean negation (unary operator): `!`, `not`

- Comparisons and equality:

  比较运算

  - Comparators: `>`, `<`, `>=`, `<=` (`gt`, `lt`, `ge`, `le`)
  - Equality operators: `==`, `!=` (`eq`, `ne`)

- Conditional operators:

  条件运算

  - If-then: `(if) ? (then)`
  - If-then-else: `(if) ? (then) : (else)`
  - Default: `(value) ?: (defaultvalue)`

  ```html
  <tr th:class="${row.even}? 'even' : 'odd'">
    ...
  </tr>
  ```

### 2.Fragment inclusion和Fragment specification  

Fragment inclusion和Fragment specification  实现了一个类似模板的功能。在我们的模板中，我们经常希望包含其他模板中的部分，例如页脚，页眉，菜单等部分。 为此，Thymeleaf提供了这个功能，只需要我们定义这些要包含的部分“片段”即可，定义使用`th:fragment`属性来完成。

#### 简单使用

简单的使用就是这样，我们定义一个footer.htrml

```html
<!DOCTYPE html>

<html xmlns:th="http://www.thymeleaf.org">

  <body>
  
    <div th:fragment="copy">
      &copy; 2011 The Good Thymes Virtual Grocery
    </div>
  
  </body>
  
</html>
```

在其他地方要使用的时候

```html
<body>
  ...

  <div th:insert="~{footer :: copy}"></div>
</body>
```

#### `th:insert`  、`th:replace`、  `th:include`)的不同

- `th:insert` insert是最简单的：它将简单地插入指定的片段作为其主机标签的主体
- `th:replace` replace实际上将其主机标签替换为指定的片段
- `th:include`th：include与th：insert相似，但是它不会插入片段，而是仅插入其中的内容

比如说我们创建一个片段是这样

```html
<footer th:fragment="copy">
  &copy; 2011 The Good Thymes Virtual Grocery
</footer>
```

然后

```html
<body>
  ...
  <div th:insert="footer :: copy"></div>

  <div th:replace="footer :: copy"></div>

  <div th:include="footer :: copy"></div>
  
</body>
```

最终源码效果

```html
<body>
  ...
  <div>
    <footer>
      &copy; 2011 The Good Thymes Virtual Grocery
    </footer>
  </div>

  <footer>
    &copy; 2011 The Good Thymes Virtual Grocery
  </footer>

  <div>
    &copy; 2011 The Good Thymes Virtual Grocery
  </div>
  
</body>
```

###   3.Fragment iteration

遍历使用`th:each`实现，直接看例子就可以懂了：

```html
<table>
  <tr>
    <th>NAME</th>
    <th>PRICE</th>
    <th>IN STOCK</th>
  </tr>
  <tr th:each="prod : ${prods}">
    <td th:text="${prod.name}">Onions</td>
    <td th:text="${prod.price}">2.41</td>
    <td th:text="${prod.inStock}? #{true} : #{false}">yes</td>
  </tr>
</table>
```

### 4.Conditional evaluation

有时需要模板的一部分才能仅在满足特定条件的情况下出现在结果中。 例如，假设我们要在产品表中显示一列，其中包含每个产品的评论数量，如果有评论，则指向该产品的评论详细信息页面的链接。 为了做到这一点，我们将使用`th:if`属性：

```html
<a href="comments.html"
   th:href="@{/product/comments(prodId=${prod.id})}" 
   th:if="${not #lists.isEmpty(prod.comments)}">view</a>
```

当然使用`th:unless`替换

```html
<a href="comments.html"
   th:href="@{/comments(prodId=${prod.id})}" 
   th:unless="${#lists.isEmpty(prod.comments)}">view</a>
```

在thymeleaf当中还有类似于java里面swith..case的结构

```html
<div th:switch="${user.role}">
  <p th:case="'admin'">User is an administrator</p>
  <p th:case="#{roles.manager}">User is a manager</p>
  <p th:case="*">User is some other thing</p>
</div>
```

这个`th:case=*`表示默认情况，需要注意的是当其中一个`th:case`被认定为`true`的时候，其他的就会被认定为`false`

### 5.General attribute modification和Specific attribute modification

这部分简单来说就是tymeleaf可以修改html中任意属性

举例：

```html
<form action="subscribe.html" th:attr="action=@{/subscribe}">
  <fieldset>
    <input type="text" name="email" />
    <input type="submit" value="Subscribe!" th:attr="value=#{subscribe.submit}"/>
  </fieldset>
</form>
```

通过`th:attr="value=#{subscribe.submit}"`修改了`value`属性，除此之后也可以这样写

```html
<input type="submit" value="Subscribe!" th:value="#{subscribe.submit}"/>
```

两者效果相同，就是说基本html的属性都可以使用`th:attr="属性名=..."`和`th:属性名=...`进行修改



## 总结

目前学习到的就这么多，有后面再记一下