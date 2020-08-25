---
title:          101-Windows系统下的Docker
date:           2019-05-23T14:20:23+08:00
draft:          true
tags:           [2019-05]
topics:         [Docker]
---


## 简介

&nbsp;&nbsp;&nbsp;&nbsp;windows下实现容器的方式与linux下实现的方法和方式都不同，这篇文章主要介绍windows下容器的实现原理与方法。由于系统厂商的性质不同，网上的相关内容都很少，这都是博主自己翻阅资料学习理解的，如果有错误欢迎指正！
<!--more-->

## 环境

无

## 软件包

无

## 拓扑图

无

## 正文
---
### 一、基本概念 
&nbsp;&nbsp;&nbsp;&nbsp;什么是 Docker on Windows不要和 Docker for Windows 弄混了。Docker for Windows 是在 Windows 上运行一个Linux虚拟机，里面跑Linux Docker。Docker on Windows 是将Docker引擎移植到Windows，提供DockerAPI， 直接在Windows系统上通过移植后的DockerEngine，来运行Windows容器，在里面跑的是Windows程序，运行于 Windows内核（而不是Linux程序运行于Linux内核）。由于使用 Docker API，可以支持Compose,Swarm等。

&nbsp;&nbsp;&nbsp;&nbsp;Docker on Windows 不是微软的fork，而是就在GitHub的docker/docker的master分支里。

&nbsp;&nbsp;&nbsp;&nbsp;在移植docker的时候发现很多Linux(存在很多年的)特性在Windows上都没有类似的东西，所以得现改Windows内核才能继续移植。所以过去的Windows无法运行，必须是改了内核后的还没发布的WindowsServer 2016以及最新版的Windows10。

&nbsp;&nbsp;&nbsp;&nbsp;Docker on Windows一定要与Docker for Windows区别开，Docker on Windows在Windows主机上运行Windows容器，里面跑的是Windows程序。而不是运行Linux容器，里面跑 Linux 程序。


### 二、运行方式

Windows运行容器的方式:

1. Windows Server Container : 通过进程和命名空间隔离技术提供应用程序隔离。 Windows Server 容器与容器主机和该主机上运行的所有容器共享内核。 这些容器不提供敌对安全边界，不应该用于隔离不受信任的代码。 由于共享内核空间，这些容器要求具有相同的内核版本和配置。

2. Hyper-V 容器:  通过在高度优化的虚拟机中运行每个容器，在由 Windows Server 容器提供的隔离上扩展。 在此配置中，容器主机的内核不与相同主机上的其他容器共享。 这些容器旨在托管敌对多租户，并且具有与虚拟机相同的安全保证。 由于这些容器与主机或主机上的其他容器不共享内核，它们可运行（与受支持的版本）采用不同版本和配置的内核 - 例如 Windows 10 上的所有 Windows 容器都使用 Hyper-V 隔离以充分利用 Windows Server 内核版本和配置。

**注意**：

&nbsp;&nbsp;&nbsp;&nbsp;运行于 Windows Server Container 的镜像和运行于 Hyper-V VM 的镜像是一样的

&nbsp;&nbsp;&nbsp;&nbsp;Docker镜像容器可以在Linux和Windows上主机运行。但是，Windows镜像只能在Windows主机上运行，Linux镜像可以在Linux主机和Windows主机上运行（到目前为止windows使用Hyper-V Linux VM），其中host表示服务器或VM。

&nbsp;&nbsp;&nbsp;&nbsp;Hyper-V容器仅由Docker管理，而Hyper-V虚拟机则由Hyper-V Manager等传统工具管理。实际上，启动Hyper-V容器需要比Windows Server Containers更长的时间，但两者都比具有完整操作系统的VM（甚至在Nano Server上）快得多。

 {{< fluid_imgs
    "pure-u-1-1|/post/images/kubernetes/101/docker_windows_002.png|/post/images/kubernetes/101/docker_windows_003.png"
>}}

### 三、实现原理

1. 在Windows系统层面，增加namespace, 增加ResourceControls(模拟 cgroups），增加UnionFS。

2. 改造Docker本身，将其中默认*nix的东西通用化，比如，fork,console,network 插件等等

3. 改造Windows以适应容器。最开始的时候，微软这帮货打算重复造轮子，想按自己的思路设计容器系统，结果碰了很多钉子后发现自己的做法貌似不大对……和Docker 的交流中，逐步的发现了自己的问题，修正自己的设计思路。



### 四、构架

&nbsp;&nbsp;&nbsp;&nbsp;对于Linux而言，构架上从下往上是， Linux内核上，运行containerd => runC => libcontainerd => Docker Engine => REST API

&nbsp;&nbsp;&nbsp;&nbsp;而Windows从libcontainerd往上构架上没有变化，主要变化在下层。内核支持了类似于cgroups, namespace, Union FS之类的东西，但是其上运行的是一个叫做ComputeService的服务，该服务替代 containerd和runc来给libcontinerd提供支持。

&nbsp;&nbsp;&nbsp;&nbsp;ComputeService: 由于现在系统底层这些新加入的功能还处于快速开发阶段，没有办法提供稳定的底层API，所以加入一层更高层面的API给容器，方便容器调用。这里的ComputeService可以大致理解为 containerd on Windows。负责管理容器，起、停、重启之类的事务。将底层的细节抽象出来。现在已经有 Compute Service 的 C#, Go 语言封装的调用库了。


1. Windows Server Container架构：

* **命名空间** 

&nbsp;&nbsp;&nbsp;&nbsp;内部并不称其为 namespace，而是称之为 silo (谷仓或者导弹发射井）,这是对 Windows 的 Job object 的扩展，这是一组进程，一组受限进程，新的内核提供了类似于命名空间的能力。支持：

    注册表
    进程 ID, 会话
    Object namespace
    文件系统
    网络部分

* **Object namespace**

&nbsp;&nbsp;&nbsp;&nbsp;系统级的namespace，是对用户隐藏的。其实在Windows中，也是存在类似于Linux中的/的概念的。比如，在 NT 内核眼里，C:\Windows映射到\DosDevices\C:\Windows下。所以这里面包含了所有的设备所需的 entry point， 如：

    \DosDevices\C: ：   文件系统
    \Registry ：        注册表
    \Device\Tcp ：      TCP 通讯

而silo可以模仿Linux里面chroot的概念，来改变上述entry point的root位置。

    \Silos\foo\DosDevices\C:
    \Silos\bar\DosDevices\C:

Windows 驱动开发工具中有一个 objdir.exe 的工具可以用来看这些信息。

* **文件系统** 

&nbsp;&nbsp;&nbsp;&nbsp;就和前面说的Windows容器非常臃肿一样，Windows文件系统也非常复杂。随着不断的添加新的特性进去，Transactions, File IDs, USN journal 等等，而Windows程序很多依赖于这些特性。

&nbsp;&nbsp;&nbsp;&nbsp;因此如果要基于此去做一个Linux世界中的AUFS，或者OverlayFS，但是支持上面这些NTFS特性的，极为困难。于是在 Windows Container v1 中，采用了类似于Device Mapper的办法 ，所不同的是，块设备是虚的，所以是 虚拟块设备 + 每个容器的NTFS 分区 的方式。使用 symlink 到宿主文件系统各层，这样让块设备不会过于臃肿。

* **注册表** 

&nbsp;&nbsp;&nbsp;&nbsp;注册表其实就是个简单的文件系统。由于它很简单，所以针对注册表的文件系统，是真的做了一个 Union FS 在上面。为每个容器保存一整套注册表的clone。由于这是 Windows 特有的东西，所以为了避免污染Docker代码，他们把注册表这个特例对Docker隐藏了。因此从Docker视角看注册表的改变就是文件的改变，所以docker diff的时候，很可能会看到注册表文件改变了，这是正常的。


2. Hyper-V 容器架构：

&nbsp;&nbsp;&nbsp;&nbsp;Hyper-V 的容器构架就和 Docker 非常不同了。这里等于是跑一个虚拟机，而不是共享内核运行。动机是因为觉得有些应用需要更好的隔离。比如多租户使用、避免提权限漏洞、有些特别的规定说某些东西必须运行于vm中等等。所以微软的想法是为什么不用VM来运行容器，所以他们方法是讲每个容器独立的运行于一个 VM 中，用户是感知不到这种变化的。

&nbsp;&nbsp;&nbsp;&nbsp;而Windows10的系统里，默认Hyper-V 容器方式。原因是，由于之前提到的那些紧耦合的原因，所以他们没有办法让Windows服务器的容器直接运行于客户端，否则会导致内核版本不一致然后出错，所以只能跑个VM来运行服务器内核，然后再到里面跑个Docker。

### 五、术语

Windows下的一些术语解释：

1. 容器主机： 物理或虚拟计算机系统使用 Windows 容器功能配置。 容器主机将运行一个或多个 Windows 容器。

2. 容器映像： 在对容器文件系统或注册表进行修改时（如软件安装），将在沙盒中捕获这些修改。 在许多情况下，你可能希望捕获此状态，以便可以创建继承这些更改的新容器。 这就是映像的本质：一旦容器停止，你便可以放弃该沙盒，或者可以将其转换为新的容器映像。 例如，让我们想象你已从 Windows Server Core 操作系统映像部署一个容器。 然后你将 MySQL 安装到此容器中。 从此容器创建新映像将充当该容器的可部署版本。 此映像将只包含所做的更改 (MySQL)，但是将充当容器操作系统映像之上的一个层。

3. 沙盒： 容器启动后，将在此“沙盒”层中捕获所有的写入操作，如文件系统修改、注册表修改或软件安装。

4. 容器操作系统映像： 从映像部署容器。 容器操作系统映像是可能组成容器的许多映像层中的第一层。 此映像提供操作系统环境。 容器操作系统映像是不可变的。 也就是说，不能对其进行修改。

5. 容器存储库： 每次创建容器映像时，容器映像及其依赖项都会存储在本地存储库中。 这些映像可以在容器主机上重复使用多次。 以便可以在许多不同的容器主机上使用它们，还可以在公共或私有注册表，如 Docker Hub 存储容器映像。

 {{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/101/docker_windows_001.png"
>}}

---
## 结束

参考

1> https://blog.lab99.org/post/docker-2016-08-12-video-windows-server-and-docker.html

2> https://youtu.be/85nCF5S8Qok