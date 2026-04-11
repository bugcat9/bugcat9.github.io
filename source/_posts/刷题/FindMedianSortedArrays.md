---
title: LeetCode FindMedianSortedArrays(寻找中位数)
date: 2020-02-08 18:10:32
tags:
- LeetCode
- 刷题
categories:
- 刷题
toc: true
---
<!-- # LeetCode FindMedianSortedArrays(寻找中位数) -->

##  题目：寻找两个有序数组的中位数
> 给定两个大小为 m 和 n 的有序数组 nums1 和 nums2。
> 请你找出这两个有序数组的中位数，并且要求算法的时间复杂度为 O(log(m + n))。
>
> 你可以假设 nums1 和 nums2 不会同时为空。
>
> **示例1：**
> nums1 = [1, 3]
> nums2 = [2]
>
> 则中位数是 2.0
>
> **示例2：**
> nums1 = [1, 2]
> nums2 = [3, 4]
>
> 则中位数是 (2 + 3)/2 = 2.5
<!--more-->
## 解题思路
> 中位数，又称中点数、中值。中数是按顺序排列的一组数据中居于中间位置的数，即在这组数据中，有一半的数据比他大，有一半的数据比它小，即如果将两个合并并且排好序之后，中位数为第（m+n）/2小的数（偶数的话，结论类似），那么问题可以转化成寻找第k小的数的问题（k=（m+n）/2）。下面是具体的步骤：

### 一、A.length>k/2 && B.length>k/2
如果数组A和数组B的元素个数都大于k/2，那么先比较A[k/2-1]和B[k/2-1]的大小，大小有两者情况

>1. A[k/2-1]<=B[k/2-1]
>
>说明如果数组A和数组B合并在一起之后，A[0]到A[k/2-1]一定排在B[k/2-1]之前，那么我们找第k小>的数，一定不会出现在A[0]到A[k/2-1]之间，所以可以将其抛弃。进而原问题就变成了对新数组A'和>B寻找第(k-k/2)小的数
>
>2. A[k/2-1]>B[k/2-1]
>
> 结论和1类似

### 二、A.length<k/2 || B.length<k/2
> 如果数组数组A和数组B其中一个元素个数小于k/2（两个长度不可能同时小于k/2），这时候以长>度较小的那个数组的长度为标准。假设minnums为元素长度较小的那个，maxnums为元素长度较>大的那个。我们采取比较minnums[minnums.length-1]和maxnums[minnums.length-1]大小来讨论。
>
> 1. minnums[minnums.length-1]<=maxnums[minnums.length-1]
>
>这种情况就比较简单了，说明两个数组合并之后minnums会全部排在maxnums的前面，所第k小的数为maxnums[k-minnums.length-1]
>
>2. minnums[minnums.length-1]>maxnums[minnums.length-1]
>
>因为minnums.length<(k/2),所以maxnums中maxnums[0]到maxnums[minnums.length-1]中肯>定不会有第k小的数，那么将其抛弃掉。进而原问题变成了寻找minnums和maxnums'的第k->minnums.length小的数。

### 三、其他情况

>1. 如果A或者B为空时，直接返回B[k-1]或者A[k-1]
>
>2. 如果k为1，只需要返回A[0]或者B[0]中较小者即可

## 代码
```java
 public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if((nums1.length+nums2.length)%2!=0)
        return getTopK(nums1, nums2,(nums1.length+nums2.length)/2+1);
    
        return (getTopK(nums1, nums2,(nums1.length+nums2.length)/2)+
            getTopK(nums1,nums2,(nums1.length+nums2.length)/2+1))/2;
    }

    /***
     * 寻找第k小的数，采取的方法是分治算法
     * @param nums1
     * @param nums2
     * @param k 从1开始数的第k个数
     * @return
     */
    public double getTopK(int[] nums1,int [] nums2,int k){
        if(nums1==null||nums1.length==0)
            return nums2[k-1];

        if(nums2==null||nums2.length==0)
            return nums1[k-1];

        if(k==1)
            return nums1[0]<nums2[0]? nums1[0]:nums2[0];

        //两个数组的长度都大于k/2
        if (nums1.length>=k/2&&nums2.length>=k/2) {
                
            int [] nums = null;     //发生变化的数组
            int [] nextnums = null; //不会发生变化的数组
            int length = 0;
            //int [] nums3 = null;
            //nums1前面k/2数小于nums2前面k/2个数
            //说明nums1前面k/2个数一定不会是topk
            if(nums1[k/2-1]<=nums2[k/2-1]){
                length = nums1.length;
                nums = nums1;
                nextnums = nums2;
            }
            else{
               
                length = nums2.length;
                nums = nums2;
                nextnums = nums1;
            }
            int [] nums3 = new int[length-k/2];
            for(int i=(k/2),j=0;i<length;i++)
            {
                nums3[j++]=nums[i];
            }
            return getTopK(nums3,nextnums,k-k/2);

        }
        else{
            //说明其中有一个数组长度小于k/2
            //因为如果两个数组长度都小于k/2，那两个数组相加都找不到topk
            
            int [] minnums = nums1.length<nums2.length?nums1:nums2; //长度较小的数组
            int [] maxnums = nums1.length<nums2.length?nums2:nums1; //长度较大的数组
            
            //说明minnums里面的元素全部排除
            if(minnums[minnums.length-1]<=maxnums[minnums.length-1]){
                return maxnums[k-minnums.length-1];
            }else{
                //只能排除maxnums中的前几个了
                int [] nums3 = new int[maxnums.length-minnums.length];
                for(int i=minnums.length,j=0;i<maxnums.length;i++)
                {
                    nums3[j++]=maxnums[i];
                }
                return getTopK(minnums,nums3,k-minnums.length);
            }
        }    
    }
```
## 最终结果
![](https://gitee.com/zhou-ning/BlogImage/raw/master/刷题/FindMedianSortedArrays.png)

来源：力扣（LeetCode）
链接：https://leetcode-cn.com/problems/median-of-two-sorted-arrays
著作权归领扣网络所有。商业转载请联系官方授权，非商业转载请注明出处。
