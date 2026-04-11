---
title: LeetCode LongestPalindrome(最长回文子串)
date: 2020-02-12 20:28:44
tags:
- LeetCode
- 刷题
categories:
- 刷题
toc: true
---
<!-- # LeetCode LongestPalindrome(最长回文子串) -->

## 题目：寻找字符串中最长回文子串
给定一个字符串 s，找到 s 中最长的回文子串。你可以假设 s 的最大长度为 1000。

**示例1**
输入: "babad"
输出: "bab"
注意: "aba" 也是一个有效答案。

**示例2**
输入: "cbbd"
输出: "bb"
<!--more-->
## 解题思路
### 思考
一看回文串的子串(去除头和尾的子串)也是回文串，就知道这题的思路一般是使用DP进行解决。那么问题是我们该怎么进行dp才能变成实现从小到大，还有该用一维数组还是该用二维数组，这都是一个问题

### 方案
最终采取的还是二维dp（思路上），我们给出 F(i,j)F(i,j) 的定义如下：
***F(i,j) = true(如果字符串S的SubStr(i,j)子串为回文串)，F(i,j) = false（不为回文串）***
所以有**F(i,j)=(F(i+1,j-1) and Si==Sj)**,然后在这种思想的基础上，我采取的方法是先初始化所有的一字母和二字母，然后再对三字母、四字母以此的进行，找到对应的回文字母。

## 代码
```java
 public String longestPalindrome(String s) {

        if(s==null||s.length()==0)//特殊情况判断
            return "";

        int strLength = s.length(); //得到长度
        //通过二维数组进行dp
        boolean F[][] =new boolean [strLength][strLength];  
        for(int i=0;i<strLength;i++){
             F[i] = new boolean[strLength];
        } 
        String res = null;
        int maxSubLength = 0;

        //初始化所有一字母和二字母
        for(int i=0;i<strLength;i++){
            F[i][i] =true;


            if(i+1<strLength&&s.charAt(i)==s.charAt(i+1)){
                F[i][i+1]=true;
                if(2>maxSubLength){
                    maxSubLength = 2;
                    res = s.substring(i, i+2);
                }
            }
            if(maxSubLength<1){
                maxSubLength = 1;
                res = s.substring(i,i+1);
            }
        }
       
        for(int j=2;j<strLength;j++){
            for(int i=0;i<strLength;i++){
                if((i+j)<strLength){
                    if(F[i+1][i+j-1]==true && s.charAt(i+j)==s.charAt(i)){
                        F[i][i+j]=true;
                        if(j+1>maxSubLength){
                            maxSubLength = j+1;
                            res = s.substring(i, i+j+1);
                        }

                    }else{
                        F[i][i+j]=false;
                    }
                }
            }
        }
        return res;
    }
```

## 改进
这样的的话时间复杂度是O(n^2),空间复杂度也是O(n^2)，是否是没有办法来进行优化呢？
我们注意到上面的二维数组F[i][j]中，只有当(i < j )时，才有意义，说明这个数组才不多一半都被浪费了。那空间是否有什么优化呢？
在看了别的大佬的答案之后，发现其实这个其实如果采取倒叙，类似于背包问题中的倒叙，那么只用一维数组就解决了。（为什么不能用正着的一维，可以自己进行思考一下）代码如下：
```java
public String longestPalindrome7(String s) {
		int n = s.length();
		String res = "";
		boolean[] P = new boolean[n];
		for (int i = n - 1; i >= 0; i--) {
			for (int j = n - 1; j >= i; j--) {
				P[j] = s.charAt(i) == s.charAt(j) && (j - i < 3 || P[j - 1]);
				if (P[j] && j - i + 1 > res.length()) {
					res = s.substring(i, j + 1);
				}
			}
		}
		return res;
	}
```
## 最终结果
![](https://gitee.com/zhou-ning/BlogImage/raw/master/刷题/LongestPalindrome.png)
## 总结
这题其实难度并不大，但是这个由二维数组到一维数组的节约是一个小技巧，我觉得值得学习一下，除此之外，这题还可以用马拉车、中心扩展法等进行求解，就不在这里进行介绍了

来源：力扣（LeetCode）
链接：https://leetcode-cn.com/problems/longest-palindromic-substring/
著作权归领扣网络所有。商业转载请联系官方授权，非商业转载请注明出处。
