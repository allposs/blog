---
title:          001-Python之NumPy
date:           2019-06-08T10:20:23+08:00
draft:          true
tags:           [2019-06]
topics:         [Python,NumPy]
---


## 简介

&nbsp;&nbsp;&nbsp;&nbsp;NumPy（Numerical Python）提供了python对多维数组对象的支持：ndarray，具有矢量运算能力，快速、节省空间。NumPy支持高级大量的维度数组与矩阵运算，此外也针对数组运算提供大量的数学函数库。NumPy的主要对象是同种元素的多维数组。这是一个所有的元素都是一种类型、通过一个正整数元组索引的元素表格(通常是元素是数字)。在NumPy中维度(dimensions)叫做轴(axes)，轴的个数叫做秩(rank)。
<!--more-->

## 环境

无

## 软件包

无

## 拓扑图

无


## 正文
---

### Ndarray 对象

&nbsp;&nbsp;&nbsp;&nbsp;NumPy 最重要的一个特点是其 N 维数组对象 ndarray，它是一系列同类型数据的集合，以 0 下标为开始进行集合中元素的索引。ndarray 对象是用于存放同类型元素的多维数组。ndarray 中的每个元素在内存中都有相同存储大小的区域。

ndarray 内部由以下内容组成：

* 一个指向数据（内存或内存映射文件中的一块数据）的指针。

* 数据类型或 dtype，描述在数组中的固定大小值的格子。

* 一个表示数组形状（shape）的元组，表示各维度大小的元组。

* 一个跨度元组（stride），其中的整数指的是为了前进到当前维度下一个元素需要"跨过"的字节数。

ndarray 的内部结构:

 {{< fluid_imgs
    " pure-u-1-1|/post/images/python/001/NumPy-001.png| Img of Hugo website"
>}}

ndarray对象属性：

{{< pure_table
"属性|含义"
"T|转置，与self.transpose( )相同，如果维度小于2返回self"
"size|数组中元素个数"
"itemsize|数组中单个元素的字节长度"
"dtype|数组元素的数据类型对象"
"ndim|数组的维度"
"shape|数组的形状"
"data|指向存放数组数据的python buffer对象"
"flat|返回数组的一维迭代器"
"imag|返回数组的虚部"
"real|返回数组的实部"
"nbytes|数组中所有元素的字节长度"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;跨度可以是负数，这样会使数组在内存中后向移动，切片中 obj[::-1] 或 obj[:,::-1] 就是如此。创建一个 ndarray 只需调用 NumPy 的 array 函数即可：

    numpy.array(object, dtype = None, copy = True, order = None, subok = False, ndmin = 0)

参数说明：

{{< pure_table
"名称|描述"
"object|数组或嵌套的数列"
"dtype|数组元素的数据类型，可选"
"copy|对象是否需要复制，可选"
"order|创建数组的样式，C为行方向，F为列方向，A为任意方向（默认）"
"subok|默认返回一个与基类类型一致的数组"
"ndmin|指定生成数组的最小维度"
>}}

numpy.ndarray()函数就是numpy的构造函数，我们可以使用这个函数创建一个ndarray对象。构造函数有如下几个可选参数：

    numpy.ndarray(shape, dtype, buffer, offset, strides, order)

参数说明：
{{< pure_table
"参数|类型|作用"
"shape|int型tuple|多维数组的形状"
"dtype|data-type|数组中元素的类型"
"buffer||用于初始化数组的buffer"
"offset|int|buffer中用于初始化数组的首个数据的偏移"
"strides|int型tuple|每个轴的下标增加1时，数据指针在内存中增加的字节数"
"order|‘C’ 或者 ‘F’|‘C’:行优先；’F’:列优先"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;ndarray 对象由计算机内存的连续一维部分组成，并结合索引模式，将每个元素映射到内存块中的一个位置。内存块以行顺序(C样式)或列顺序(FORTRAN或MatLab风格，即前述的F样式)来保存元素。

    #! /usr/bin/env python3
    #! _*_ coding: utf-8 _*_
    #python -m pip install -U numpy scipy matplotlib
    import numpy as np

    a = np.array([1,2,3])  
    print (a)

    # 多于一个维度  
    a = np.array([[1,  2],  [3,  4]])  
    print ("多一个维度:")
    print (a)

    # 最小维度  
    a = np.array([1,  2,  3,4,5], ndmin =  2)  
    print ("最小维度:")
    print (a)

    # dtype 参数  
    a = np.array([1,  2,  3], dtype = complex)  
    print ("dtype 参数:")
    print (a)

    #T属性
    print ("T属性:")
    print(a.T)

    #size属性
    print ("size属性:")
    print(a.size)

    #itemsize属性
    print ("itemsize属性:")
    print(a.itemsize)

    # dtype属性
    print ("dtype属性:")
    print(a.dtype)

    # ndim属性
    print ("ndim属性:")
    print(a.ndim)

    # shape属性
    print ("shape属性:")
    print(a.shape)

    # data属性
    print ("data属性:")
    print(a.data)

    # flat属性
    print ("flat属性:")
    print(a.flat)

    # imag属性
    print ("imag属性:")
    print(a.imag)

    # real属性
    print ("real属性:")
    print(a.real)

    # nbytes属性
    print ("nbytes属性:")
    print(a.nbytes)



---
## 结束