---
title: Qt绘制二叉树
date: 2020-03-01 11:51:53
tags:
- Qt
- binarytree 
categories:
- DataStructure
toc: true
---

<!-- # Qt绘制二叉树 -->

## 介绍

Qt绘制二叉树是大二时数据结构的一个实习题目，当时的功能要求如下：

 * 键盘输入二叉树结点序列（前序或层次），创建一棵二叉树
* 实现**SwapTree**方法，以根结点为参数，交换每个结点的左子树和右子树（提示：前序递归）
 * 实现**Find**方法，查找值为**key**的结点，并输出该结点的所有祖先结点
 * **输入一棵二叉树的前序遍历序列和中序遍历序列，重构这棵二叉树（这个序列里面是不带空结点’#‘的）**



 二叉树的前序和中序创建要求如下：

 + 要求键盘输入二叉树结点序列
+ 结点序列可以是前序，也可以是层次
 + 空结点以**#**表示

 由题目可知呢主要就是可视化一颗二叉树，另外需要说清的是**仅仅前序遍历是无法确定一颗二叉树的顺序的，但是如果前序中加上空节点‘#’，是可以确定的**

**示例1（前序和层次的）：**

![QTbinarytree.png](https://gitee.com/zhou-ning/BlogImage/raw/master/数据结构/QTbinarytree.png)

**示例2（前序=“ABC##DE#G##F###” 或者 层次=“AB#CD##EF#G####”）：**

![QTbinarytree3](https://gitee.com/zhou-ning/BlogImage/raw/master/数据结构/QTbinarytree3.png)

**示例3（前序="ABHFDECKG"和中序="HBDFAEKCG"）：**

![QTbinarytree4](https://gitee.com/zhou-ning/BlogImage/raw/master/数据结构/QTbinarytree4.png)

## 主要建树思路

1. 主要功能就前序构造、层次构造、交换节点、查找关键字、重新构建这几个，所以为了图便捷，就直接在Qt提供的ui界面上加上这几个菜单项，可以参考下图

![QTbinarytree2](https://gitee.com/zhou-ning/BlogImage/raw/master/数据结构/QTbinarytree2.png)

2. 二叉树根据前序生成一颗树。编写了一个函数CreateBinTree，利用递归进行二叉树的生成。思路也比较简单可以看下面的代码。
```c++
//前序创造节点
//i代表第几个字母
void BinaryTree::CreateBinTree(QString &str, BinTreeNode *&Node,int &i)
{
//  qDebug()<<str;
if(str[i]!='#')//说明不是空结点
{
   Node=new BinTreeNode(str[i]);
   Treesize++;
   i++;
   this->CreateBinTree(str,Node->left,i);
   this->CreateBinTree(str,Node->right,i);
}
else
{
   i++;
   Node=nullptr;
}
}
```

3. 二叉树的层次遍历生成一颗二叉树。这个利用队列来完成，利用队列遍历字符串，先将字符串第一个字符塞进队列作为根节点，然后按顺序遍历字符串并且创建对应的孩子节点，具体如下。
```c++
int j=0;
    Treesize=0;
    QQueue<BinTreeNode *>Q;
    BinTreeNode *p=nullptr;
    if(str[j]=='#')   //先创建根节点
    {
        Treesize=0;
        return;
    }
    root=new BinTreeNode(str[j]);
    Treesize++;
    Q.enqueue(root);
    j++;
while(j<(str.size()-1))
    {
       if(Q.isEmpty())
            break;
         else
            p=Q.dequeue();
			if(str[j]!='#')   //如果字符不为‘#’，创建左结点
        {
            p->left=new BinTreeNode(str[j]);
            Treesize++;
            Q.enqueue(p->left);
        }
         j++;
        if(str[j]!='#')   //如果字符不为‘#’，创建右结点
        {
            p->right=new BinTreeNode(str[j]);
            Treesize++;
            Q.enqueue(p->right);
        }
         j++;
    }
```
4. 通过前序和中序建树。前序和中序确定树的顺序思想比较简单，利用前序的特性找到父节点，然后利用中序确定左右子树，然后重复这样的过程。代码如下，借鉴一下就行，看以前的代码自己都想吐槽。
```c++
//前序和中序建树
//pre代表前序字符串
//in代表中序字符串
//n代表pre可以到的位置
//测试用例： 前序："ABHFDECKG"，中序："HBDFAEKCG"
BinTreeNode *BinaryTree::creatBinaryTree(QString pre, QString in, int n)
{
  qDebug()<<pre;
  qDebug()<<in;
  if(n==0) return nullptr;
  int k=0;
  while(pre[0]!=in[k]&&k<in.length())k++;
  if(k>=in.length()) return nullptr;  //理论上应该需要抛出异常的，
  BinTreeNode *t=new BinTreeNode(pre[0]);
  //以位置k分为左子树和右子树
  t->left=creatBinaryTree(pre.mid(1),in,k);//从0-k是左子树，所以在这里pre只能遍历到k
  t->right=creatBinaryTree(pre.mid(k+1),in.mid(k+1),n-k-1);
  //由于pre和in同时都只保留右子树部分，所以pre
  return t;
}
```

上面建树的例子看看就行，尤其是最后一个前中序建树，也不知道自己当时是怎么写出这么魔性的代码。下面就专门介绍一下画二叉树的部分。

## 主要画树思路

 画树是利用了Qt的绘图事件，直接进行画图，画图是在建树已经完成的基础之上完成的。**想法比较简单，所以画出来的比较难看，先在这里说明一下**。

 1. 二叉树的节点是圆形的，半径为25。二叉树的子节点和父节点之间x轴上相差45，y轴上100。举个例子：父节点的坐标为（x，y），则左孩子坐标为（x-45，y+100），右孩子坐标为（x+45，y+100）。根节点的坐标设置为（500，75），这些数据都可以根据自己的需求改，不定死。

 2. 数据结构设计的时候，对于二叉树的节点BinTreeNode，设计一个data（QChar类型，用于存储数据）、point（QPoint类型，用于存储位置）

 3. 数据结构设计时，对于二叉树BinaryTree，设计Mypoints（QPoint *类型，存储树各个结点坐标）、My_lines（ QLine *类型，存储需要画的线的条数）

 4. 写一个函数setMyPoints，通过层次遍历，完成各个坐标的匹配。其中对于Mypoints直接存储节点的中心，然后画圆；对于线段，从上面的例子也看得出来是父节点的中心向下半径个位置作为起点，子节点中心向上半径个位置为终点。具体代码如下所示

    ```c++
    //为坐标组设置应的坐标,以及得到相应的线段
    void BinaryTree::setMyPoints()
    {
          //设置父节点和子节点间横坐标相差的距离
    
        int i=0;
    //    int H=height();
        Mypoints=new QPoint[Treesize];  //动态分配空间
        My_lines=new QLine[Treesize-1];
    
        QQueue<BinTreeNode *>Q;         //调用队列
        BinTreeNode *p=root;
        root->setpoint(QPoint(500,75));  //为根节点设置坐标
        Q.enqueue(root);
        Mypoints[i]=root->point;
    
        //通过层次遍历，完成各个坐标的匹配
        while(!Q.isEmpty())
        {
            p=Q.dequeue();
            if(p->left!=nullptr)
            {
                i++;
                int h=height(p);
                p->left->setpoint(p->point-QPoint(45*h,-100));
                Mypoints[i]=p->left->point;
                My_lines[i-1].setP1(p->point+QPoint(0,25));//线
                My_lines[i-1].setP2(p->left->point-QPoint(0,25));
                Q.enqueue(p->left);
            }
    
            if(p->right!=nullptr)
            {
                i++;
                int h=height(p);
                p->right->setpoint(p->point+QPoint(45*h,100));
                Mypoints[i]=p->right->point;
                My_lines[i-1].setP1(p->point+QPoint(0,25));
                My_lines[i-1].setP2(p->right->point-QPoint(0,25));
                Q.enqueue(p->right);
                h--;
            }
    
        }
    
    }
    ```


 5. 对于左侧显示的字符，这个就比较简单了，直接在建树之后进行相对应的前序、中序、后续、层次遍历，然后将字符串保存下来即可，在这里就不展开详细讲解

## 总结

我画二叉树的思想比较简单，所以画出来也不是很好看，代码虽然可以运行，但是也有一些小细节上的问题，如果有什么更好的意见欢迎指教。

[源码传输门](https://github.com/zhou-ning/Qtbinarytree.git)