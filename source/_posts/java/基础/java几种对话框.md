---
title: java自定义对话框弹出
date: 2020-04-12 18:19:26
tags:
- java
categories:
- java
toc: true
---
<!-- # java自定义对话框弹出 -->

> 本次实习因为写java界面，有一个自定义对话框的需求，在网上查了一些才发现了一种方法，所以记录一下。具体需求类似于这样：按下一个按钮弹出一个输入界面，输入行李的长宽高，然后进行显示。需求很简单，最重要的是信息在两个界面之间传递。
<!--more-->
## 具体实现

具体实现只讲比较重要的一些部分

1. 编写界面继承自`JDialog`

```java
public class BaggageGUI extends JDialog  implements ActionListener{


    JTextField LengthField = new JTextField();    //长
    JTextField WidthField = new JTextField();    //宽
    JTextField HeighField = new JTextField();    //高
    JTextField WeightField = new JTextField();    //重
    JButton  addbtu =new JButton("确定添加");
	
    public Baggage getBaggage() {
        return baggage;
    }

    Baggage baggage;	//自定义的一个类，里面有长宽高重这四个字段
    public BaggageGUI()  {

        this.setTitle("普通行李");
        this.setSize(400, 250);
        init();
        this.setLayout(null);
//        this.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
//        this.setVisible(true);
    }

    private void init()
    {
        JLabel jl1 = new JLabel("长:");//jl1.setOpaque(true);jl1.setBackground(Color.GREEN);
        JLabel jl2 = new JLabel("宽:");
        JLabel jl3 = new JLabel("高:");
        JLabel jl4 = new JLabel("重:");
        jl1.setBounds(10, 10, 50, 25);LengthField.setBounds(100,10,200,30);
        jl2.setBounds(10, 50, 50, 25);WidthField.setBounds(100,50,200,30);
        jl3.setBounds(10, 90, 50, 25);HeighField.setBounds(100,90,200,30);
        jl4.setBounds(10, 130, 50, 25);WeightField.setBounds(100,130,200,30);
        addbtu.setBounds(50, 170, 300, 30);
        this.add(jl1);
        this.add(jl2);
        this.add(jl3);
        this.add(jl4);
        this.add(LengthField);
        this.add(WidthField);
        this.add(HeighField);
        this.add(WeightField);
        this.add(addbtu);

        addbtu.addActionListener(this);
    }

    public void actionPerformed(ActionEvent e) {
        float length = Float.valueOf(LengthField.getText());
        float width = Float.valueOf(WidthField.getText());
        float heigh = Float.valueOf(HeighField.getText());
        float weight = Float.valueOf(WeightField.getText());
        baggage = new Baggage(width, heigh,length , weight);
        System.out.println(baggage);
        this.setVisible(false);

    }
}

```

2. 在主界面当中创建该界面的引用，并设置`setModal()`函数

如：我的主界面是`CalculatorGUI`,在`CalculatorGUI`当中我设置一个`BaggageGUI`的引用，q

说是子窗口也行。

```java
 BaggageGUI baggageGUI = new BaggageGUI();
```

然后在构造`CalculatorGUI`的时候调用`baggageGUI`的`setModal()`函数

```java
baggageGUI.setVisible(true);
```

该函数的作用为设置对话框为**”模态“**，模态对话框，关闭当前对话框前，无法操作其他窗口，这样可以阻塞主对话框，让我在对`baggageGUI`输入后，再变成运行状态，然后可以顺利取得我设置的行李。

3. 在按钮按下事件当中调用`baggageGUI`,让其显示

```java
 addBagBut.addActionListener(new ActionListener(){

            public void actionPerformed(ActionEvent e) {
                baggageGUI.setVisible(true);

                Baggage baggage = baggageGUI.getBaggage();

                bagInfo.append(baggage.toString());
            }
        });
```

## 显示效果

主界面：

<img src="https://gitee.com/ning_zhou/BlogImage/raw/master/java/对话框1.png" alt="对话框1" style="zoom:80%;" />

`BaggageGUI`界面：

<img src="https://gitee.com/ning_zhou/BlogImage/raw/master/java/对话框2.png" alt="对话框2" style="zoom:80%;" />

添加之后：

<img src="https://gitee.com/ning_zhou/BlogImage/raw/master/java/对话框3.png" alt="对话框3" style="zoom:80%;" />

## 补充java的对话框使用

**这部分是转载别人的博客**，[原博客这里](https://blog.csdn.net/qs17809259715/article/details/88062414)

1. showMessageDialog(只显示一个确定按钮的对话框)

* 普通对话框Java代码

```java
JOptionPane.showMessageDialog(null, "普通对话框");
```

![普通对话框](https://gitee.com/ning_zhou/BlogImage/raw/master/java/普通对话框.jpg)


* 警告提示框Java代码

```java
JOptionPane.showMessageDialog(null, "警告提示框", "Title",JOptionPane.WARNING_MESSAGE);
```

![警告提示框](https://gitee.com/ning_zhou/BlogImage/raw/master/java/警告提示框.png)


* 错误提示框Java代码

```java
JOptionPane.showMessageDialog(null, "错误提示框", "Title",JOptionPane.ERROR_MESSAGE);
```

![错误提示框](https://gitee.com/ning_zhou/BlogImage/raw/master/java/错误提示框.png)

* 基本提示框java代码

```java
JOptionPane.showMessageDialog(null, "最基本提示框", "Title",JOptionPane.PLAIN_MESSAGE);
```

![最基本提示框](https://gitee.com/ning_zhou/BlogImage/raw/master/java/最基本提示框.png)

2. showConfirmDialog（确认对话框，对话框的按钮通常为：“是”、“否”、“取消”和“确认”及其组合）。

* “是” “否”对话框Java代码

```java
int n = JOptionPane.showConfirmDialog(null, "你是否喜欢Java？", "Title",JOptionPane.YES_NO_OPTION); 
```

![确认对话框](https://gitee.com/ning_zhou/BlogImage/raw/master/java/确认对话框.png)

3. showOptionDialog(自定义选择提示对话框)

```java
Object[] options ={ "喜欢", "不喜欢" };  //自定义按钮上的文字
int m = JOptionPane.showOptionDialog(null, "你喜欢这篇博客吗？", "Title",JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE, null, options, options[0]); 
```

![自定义选择提示对话框](https://gitee.com/ning_zhou/BlogImage/raw/master/java/自定义选择提示对话框.png)

4. showInputDialog（下拉框或者输入框）

* 下拉框Java代码

```java
Object[] options ={ "苹果", "橘子", "香蕉" };  
String s = (String) JOptionPane.showInputDialog(null,"请选择你喜欢吃的水果:\n", "水果", JOptionPane.PLAIN_MESSAGE, new ImageIcon("xx.png"), options, "xx");
```

![下拉框对话框](https://gitee.com/ning_zhou/BlogImage/raw/master/java/下拉框对话框.png)

* 输入框Java代码

```java
JOptionPane.showInputDialog(null," Please input：\n","title",JOptionPane.PLAIN_MESSAGE);
```

![输入框对话框](https://gitee.com/ning_zhou/BlogImage/raw/master/java/输入框对话框.png)

## 总结

写了一下java对话框相关的内容，用java写界面其实用的不多，但是有备无患记录一下。

**转载**：[https://blog.csdn.net/qs17809259715/article/details/88062414](https://blog.csdn.net/qs17809259715/article/details/88062414)

**参考**：[https://blog.csdn.net/ayangann915/article/details/80410788](https://blog.csdn.net/ayangann915/article/details/80410788)

