---
title:          102-Docker的核心原理
date:           2019-05-20T14:20:23+08:00
draft:          true
tags:           [2019-05]
topics:         [Docker,Golang,Namespaces]
---


## 简介

Docker 核心技术主要从以下几个方面实现：

&nbsp;&nbsp;&nbsp;&nbsp;命名空间(namespace):通过进程命名空间，将docker进程和宿主进程进行隔离.

&nbsp;&nbsp;&nbsp;&nbsp;网络:docker打通命名空间与外部通讯的方式，类型有：bridge模式网络，host模式网络，container模式网络，none模式网络。

&nbsp;&nbsp;&nbsp;&nbsp;文件隔离(cgroup):通过加载虚拟挂载点，重设 root 目录等等，将文件系统进行隔离物理资源的隔离，通过 CGroups（Control Groups），限制容器在 CPU，内存，磁盘IO、网络上的使用率，以此来隔离容器间的资源分配。

&nbsp;&nbsp;&nbsp;&nbsp;镜像:Dockerfile 中的每条命令会形成一个 diff 层，每个 diff 层都是只读的，只有最上面的层是可写的。这个操作通过 UnionFS 实现。通过AUFS，Btrfs，Device mapper，Overlayfs，ZFS，VFS，可以将未修改的镜像层进行联合挂载，从而提高读写效率。
<!--more-->

## 环境

        Ubuntu 19.04
        Visual Studiao Code 1.33.1
        go version go1.12.5 linux/amd64 

## 软件包

无

## 拓扑图

无

## 正文
---
### 一、Docker核心技术

&nbsp;&nbsp;&nbsp;&nbsp;Docker 核心技术主要从以下几个方面实现：

&nbsp;&nbsp;&nbsp;&nbsp;命名空间(namespace):通过进程命名空间，将docker进程和宿主进程进行隔离.

&nbsp;&nbsp;&nbsp;&nbsp;网络:docker打通命名空间与外部通讯的方式，类型有：bridge模式网络，host模式网络，container模式网络，none模式网络。

&nbsp;&nbsp;&nbsp;&nbsp;文件隔离(cgroup):通过加载虚拟挂载点，重设 root 目录等等，将文件系统进行隔离
物理资源的隔离，通过 CGroups（Control Groups），限制容器在 CPU，内存，磁盘IO、网络上的使用率，以此来隔离容器间的资源分配。

&nbsp;&nbsp;&nbsp;&nbsp;镜像:Dockerfile 中的每条命令会形成一个 diff 层，每个 diff 层都是只读的，只有最上面的层是可写的。这个操作通过 UnionFS 实现。通过AUFS，Btrfs，Device mapper，Overlayfs，ZFS，VFS，可以将未修改的镜像层进行联合挂载，从而提高读写效率。


### 二、命名空间(NameSpace)
 
### 1. Linux 命名空间简介

&nbsp;&nbsp;&nbsp;&nbsp;Linux Namespaces（Linux 命名空间）机制提供了进程使用操作系统资源时的隔离方式，是基于内核实现轻量级虚拟化（容器化，例如 docker）的实现基础。

&nbsp;&nbsp;&nbsp;&nbsp;Linux 内核从版本 2.4.19 开始陆续引入了 namespace 的概念。其目的是将某个特定的全局系统资源（global system resource）通过抽象方法使得namespace 中的进程看起来拥有它们自己的隔离的全局系统资源实例。Linux内核中实现了六种 namespace，按照引入的先后顺序，列表如下：
 
 {{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespace.png| Img of Hugo website"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;具体来说在 Linux Kernel 中有一组名为 Namespace 的系统调用 API。主要作用是封装了全局的系统资源的调用分配，在一个进程中隔离了其他进程的可见性，让自己 “拥有” 整个计算机的资源的能力。一个典型的用途就是容器的实现。

namespace 一共只有4个系统级别调用API：

* [clone](http://man7.org/linux/man-pages/man2/clone.2.html "clone")：创建一个隔离的进程，可以通过参数控制所拥有的资源
* [setns](http://man7.org/linux/man-pages/man2/setns.2.html "setns")：允许一个进程到现有的 namespace
* [unshare](http://man7.org/linux/man-pages/man2/unshare.2.html "unshare")：从现有 namespace 中移除一个进程
* [ioctl](http://man7.org/linux/man-pages/man2/ioctl.2.html "ioctl")：用法发现 namespace 信息

&nbsp;&nbsp;&nbsp;&nbsp;接下来主要讨论如何创建一个具有隔离性的进程，也就是 clone 这个系统调用的用法,调用clone时可以传递一个或多个CLONE_*的flags.每个命名空间都有相对应CLONE_*的flags.具体如下:
{{< pure_table
		"命名空间简称|Syscall方法|隔离内容"
        "IPC|CLONE_NEWIPC|System V IPC 和 POSIX message queue"
        "Network|CLONE_NEWNET|网络设备等"
        "Mount|CLONE_NEWNS|挂载点"
        "PID|CLONE_NEWPID|进程的 ID"
        "User|CLONE_NEWUSER|用户或组的 ID"
        "UTS|CLONE_NEWUTS|Hostname 和 NIS domain"
		"Cgroup|CLONE_NEWCGROUP|CGROUP根目录(http://man7.org/linux/man-pages/man7/namespaces.7.html)内核4.5版本新增"
>}}

* **CLONE_NEWPID**:

>&nbsp;&nbsp;&nbsp;&nbsp;当程序代码调用clone时，设定了CLONE_NEWPID，就会创建一个新的PID Namespace，clone出来的新进程将成为Namespace里的第一个进程。一个PID Namespace为进程提供了一个独立的PID环境，PID Namespace内的PID将从1开始，在Namespace内调用fork，vfork或clone都将产生一个在该Namespace内独立的PID。新创建的Namespace里的第一个进程在该Namespace内的PID将为1，就像一个独立的系统里的init进程一样。该Namespace内的孤儿进程都将以该进程为父进程，当该进程被结束时，该Namespace内所有的进程都会被结束。PID Namespace是层次性，新创建的Namespace将会是创建该Namespace的进程属于的Namespace的子Namespace。子Namespace中的进程对于父Namespace是可见的，一个进程将拥有不止一个PID，而是在所在的Namespace以及所有直系祖先Namespace中都将有一个PID。系统启动时，内核将创建一个默认的PID Namespace，该Namespace是所有以后创建的Namespace的祖先，因此系统所有的进程在该Namespace都是可见的。

* **CLONE_NEWIPC**:

>&nbsp;&nbsp;&nbsp;&nbsp;当调用clone时，设定了CLONE_NEWIPC，就会创建一个新的IPC Namespace，clone出来的进程将成为Namespace里的第一个进程。一个IPC Namespace有一组System V IPC objects 标识符构成，这标识符有IPC相关的系统调用创建。在一个IPC Namespace里面创建的IPC object对该Namespace内的所有进程可见，但是对其他Namespace不可见，这样就使得不同Namespace之间的进程不能直接通信，就像是在不同的系统里一样。当一个IPC Namespace被销毁，该Namespace内的所有IPC object会被内核自动销毁。

* **PID Namespace和IPC Namespace**:

>&nbsp;&nbsp;&nbsp;&nbsp;PID Namespace和IPC Namespace可以组合起来一起使用，只需在调用clone时，同时指定CLONE_NEWPID和CLONE_NEWIPC，这样新创建的Namespace既是一个独立的PID空间又是一个独立的IPC空间。不同Namespace的进程彼此不可见，也不能互相通信，这样就实现了进程间的隔离。

* **CLONE_NEWNS**:

>&nbsp;&nbsp;&nbsp;&nbsp;当调用clone时，设定了CLONE_NEWNS，就会创建一个新的mount Namespace。每个进程都存在于一个mount Namespace里面，mount Namespace为进程提供了一个文件层次视图。如果不设定这个flag，子进程和父进程将共享一个mount Namespace，其后子进程调用mount或umount将会影响到所有该Namespace内的进程。如果子进程在一个独立的mount Namespace里面，就可以调用mount或umount建立一份新的文件层次视图。该flag配合pivot_root系统调用，可以为进程创建一个独立的目录空间。

* **CLONE_NEWNET**:

>&nbsp;&nbsp;&nbsp;&nbsp;当调用clone时，设定了CLONE_NEWNET，就会创建一个新的Network Namespace。一个Network Namespace为进程提供了一个完全独立的网络协议栈的视图。包括网络设备接口，IPv4和IPv6协议栈，IP路由表，防火墙规则，sockets等等。一个Network Namespace提供了一份独立的网络环境，就跟一个独立的系统一样。一个物理设备只能存在于一个Network Namespace中，可以从一个Namespace移动另一个Namespace中。虚拟网络设备(virtual network device)提供了一种类似管道的抽象，可以在不同的Namespace之间建立隧道。利用虚拟化网络设备，可以建立到其他Namespace中的物理设备的桥接。当一个Network Namespace被销毁时，物理设备会被自动移回init Network Namespace，即系统最开始的Namespace。

* **CLONE_NEWUTS**:

>&nbsp;&nbsp;&nbsp;&nbsp;当调用clone时，设定了CLONE_NEWUTS，就会创建一个新的UTS Namespace。一个UTS Namespace就是一组被uname返回的标识符。新的UTS Namespace中的标识符通过复制调用进程所属的Namespace的标识符来初始化。Clone出来的进程可以通过相关系统调用改变这些标识符，比如调用sethostname来改变该Namespace的hostname。这一改变对该Namespace内的所有进程可见。CLONE_NEWUTS和CLONE_NEWNET一起使用，可以虚拟出一个有独立主机名和网络空间的环境，就跟网络上一台独立的主机一样。

* **集合**

>&nbsp;&nbsp;&nbsp;&nbsp;以上所有clone flag都可以一起使用，为进程提供了一个独立的运行环境。LXC正是通过在clone时设定这些flag，为进程创建一个有独立PID，IPC，FS，Network，UTS空间的container。一个container就是一个虚拟的运行环境，对container里的进程是透明的，它会以为自己是直接在一个系统上运行的。

>&nbsp;&nbsp;&nbsp;&nbsp;一个container就像传统虚拟化技术里面的一台安装了OS的虚拟机，但是开销更小，部署更为便捷。

### 2. 命名空间Golang实操

&nbsp;&nbsp;&nbsp;&nbsp;注意以下代码使用的编译系统均为LINUX系统,golang的交叉编译方法：CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build .

#### 1). UTS

&nbsp;&nbsp;&nbsp;&nbsp;先创建一个UTS隔离的新进程，这里额外使用了 Sirupsen的logrus库进行日志输出。在golang的GOPATH目录下的src创建一个UTS_001目录。

    $ vim UTS_001.go
        package main
        import (
        	"flag"
        	"log"
        	"os"
        	"os/exec"
        	"syscall"
        )

        func main() {
        	var nsShell string
        	flag.StringVar(&nsShell, "nsshell", "/bin/sh", "Path to the shell to use")
        	flag.Parse()
        	nsRun(nsShell)
        }
        func nsRun(command string) {
        	cmd := exec.Command(command)
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	cmd.SysProcAttr = &syscall.SysProcAttr{
        		Cloneflags: syscall.CLONE_NEWUTS,
        	}
        	if err := cmd.Run(); err != nil {
        		log.Printf("Error running the /bin/sh command - %s\n", err)
        		os.Exit(1)
        	}
        }


在 root 权限下执行:

    $ go run main.go

&nbsp;&nbsp;&nbsp;&nbsp;此时在一个新的进程中执行了bash命令，由于指定了flag syscall.CLONE_NEWUTS, 此时已经与之前的进程不在同一个UTS namespace中了。在新bash和原bash中分别执行ls -l /proc/$$/ns进行验证

新UTS：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_uts_001.png| Img of Hugo website"
>}}

源UTS：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_uts_002.png| Img of Hugo website"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;可以看到这里两个只有uts所指向的ID不同，因为之前只指定UTS的隔离。在新sh中执行hostname nshost更改当前的hostname, 可以看到这里的hostname已经被改成了newhost, 但是原来的sh中依然是Ubuntu, 同样证明UTS隔离成功了。

新UTS：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_uts_003.png| Img of Hugo website"
>}}

源UTS：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_uts_004.png| Img of Hugo website"
>}}


&nbsp;&nbsp;&nbsp;&nbsp;为了在启动sh的同时就能够将其hostname修改为新的hostname，在golang的GOPATH目录下的src创建一个UTS_002目录,将上面代码修改如下并写入UTS_002/UTS_002.go:

        $ vim UTS_002.go
        package main
        import (
        	"flag"
        	"fmt"
        	"log"
        	"os"
        	"os/exec"
        	"syscall"
        )

        func main() {
        	var nsShell, nsHostName string
        	flag.StringVar(&nsShell, "nsshell", "/bin/sh", "The path to the shell where the namespace is running")
        	flag.StringVar(&nsHostName, "nshostname", "/nshost", "Path to the shell to use")
        	flag.Parse()
        	nsRun(nsShell, nsHostName)
        }
        func nsRun(command, hostname string) {
        	cmd := exec.Command(command)
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	cmd.SysProcAttr = &syscall.SysProcAttr{
        		Cloneflags: syscall.CLONE_NEWUTS,
        	}
        	if err := syscall.Sethostname([]byte(hostname)); err != nil {
        		fmt.Printf("Error setting hostname - %s\n", err)
        		os.Exit(1)
        	}
        	if err := cmd.Run(); err != nil {
        		log.Printf("Error running the /bin/sh command - %s\n", err)
        		os.Exit(1)
        	}

        }

执行 go run UTS_002.go:

    $ go run UTS_002.go

可以看到执行命令效果如下：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_uts_005.png| Img of Hugo website"
>}}

可以看到主机名称已经更改为nshost

#### 2). PID

&nbsp;&nbsp;&nbsp;&nbsp;在golang的GOPATH目录下的src创建一个PID_001目录

&nbsp;&nbsp;&nbsp;&nbsp;为了进行PID的隔离将nsRun()函数中cmd.SysProcAttr修改为

        Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWPID,

&nbsp;&nbsp;&nbsp;&nbsp;此时再次运行，并执行ps查看当前进程，发现和主机上一样，并没有被隔离。这是因为ps总是查看/proc，如果要进行隔离，则需要修改/(根)。

&nbsp;&nbsp;&nbsp;&nbsp;下面获取一个unix文件系统，可以选择docker的busybox镜像，并将其导出。

        $ docker pull busybox
        $ docker run -d busybox top -b

&nbsp;&nbsp;&nbsp;&nbsp;此时获得刚刚的容器的containerID，然后执行

        $ docker export -o busybox.tar <刚才容器的ID>

&nbsp;&nbsp;&nbsp;&nbsp;即可在当前目录下得到一个busybox的压缩包

        $ mkdir /tmp/busybox
        $ tar -xf busybox.tar -C /tmp/busybox/

&nbsp;&nbsp;&nbsp;&nbsp;解压即可得到我们需要的文件系统

&nbsp;&nbsp;&nbsp;&nbsp;查看一下busybox目录

        $ ls /tmp/busybox
        bin  dev  etc  home  proc  root  sys  tmp  usr  var

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_pid_001.png| Img of Hugo website"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;接下来通过syscall.Chroot()将nshost的根目录修改为busybox的目录,然后在进入shell之后通过os.Chdir()切换到新的根目录下，然后通过syscall.Mount("proc", "proc", "proc", 0, "")挂载虚拟文件系统proc(proc是一个伪文件系统，只存在于内存中，以文件系统的方式为访问系统内核数据的操作提供接口，/proc目录下的文件记录了正在运行的进程的相关信息), 运行结束之后还要卸载刚才挂载的proc

&nbsp;&nbsp;&nbsp;&nbsp;修改后代码：

        package main
        import (
        	"flag"
        	"os"
        	"os/exec"
        	"syscall"

        	"github.com/sirupsen/logrus"
        )

        func main() {
        	var nsShell, nsHostName, rootPath string
        	flag.StringVar(&nsShell, "nsshell", "/bin/sh", "The path to the shell where the namespace is running")
        	flag.StringVar(&nsHostName, "nshostname", "nshost", "Path to the shell to use")
        	flag.StringVar(&rootPath, "rootfs", "/tmp/busybox", "Path to the root filesystem to use")
        	flag.Parse()
        	switch os.Args[1] {
        	case "run":
        		nsRun(nsShell, nsHostName, rootPath)
        	case "child":
        		chRoot(nsShell, rootPath)
        	default:
        		logrus.Errorf("wrong command")
        		return
        	}

        }

        //nsInit ns初始化
        func nsInit(command, hostname, newRootPath string) {
        	//check(mountRoot(newRootPath))
        	nsRun(command, hostname, newRootPath)
        }

        func nsRun(command, hostname, newRootPath string) {
        	cmd := exec.Command("/proc/self/exe", "child")
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	cmd.SysProcAttr = &syscall.SysProcAttr{
        		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWPID,
        	}
        	check(syscall.Sethostname([]byte(hostname)))
        	check(cmd.Run())
        }

        func chRoot(command, newroot string) {
        	cmd := exec.Command(command)
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	check(syscall.Chroot(newroot))
        	check(os.Chdir("/"))
        	check(syscall.Mount("proc", "proc", "proc", 0, ""))
        	check(cmd.Run())
        	check(syscall.Unmount("proc", 0))
        }

        func check(err error) {
        	if err != nil {
        		logrus.Errorln(err)
        	}
        }




执行命令go run PID_001.go run:

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_pid_002.png| Img of Hugo website"
>}}

上面代码只是挂载了proc目录，如果不使用cmd := exec.Command("/proc/self/exe", "child")重载看到的进程为空。

#### 3). Mount

&nbsp;&nbsp;&nbsp;&nbsp;在golang的GOPATH目录下的src创建一个Mount_001目录,将上面代码修改如下并写入Mount_001/Mount_001.go

        package main

        import (
        	"flag"
        	"os"
        	"os/exec"
        	"syscall"

        	"github.com/sirupsen/logrus"
        )

        func main() {
        	var nsShell, nsHostName, rootPath string
        	flag.StringVar(&nsShell, "nsshell", "/bin/sh", "The path to the shell where the namespace is running")
        	flag.StringVar(&nsHostName, "nshostname", "nshost", "Path to the shell to use")
        	flag.StringVar(&rootPath, "rootfs", "/tmp/busybox", "Path to the root filesystem to use")
        	flag.Parse()
        	switch os.Args[1] {
        	case "run":
        		nsRun(nsShell, nsHostName, rootPath)
        	case "child":
        		chRoot(nsShell, rootPath)
        	default:
        		logrus.Errorf("wrong command")
        		return
        	}

        }

        //nsInit ns初始化
        func nsInit(command, hostname, newRootPath string) {
        	//check(mountRoot(newRootPath))
        	nsRun(command, hostname, newRootPath)
        }

        func nsRun(command, hostname, newRootPath string) {
        	cmd := exec.Command("/proc/self/exe", "child")
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	cmd.SysProcAttr = &syscall.SysProcAttr{
        		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWPID,
        	}
        	check(syscall.Sethostname([]byte(hostname)))
        	check(cmd.Run())
        }

        func chRoot(command, newroot string) {
        	cmd := exec.Command(command)
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	check(syscall.Chroot(newroot))
        	check(os.Chdir("/"))
        	check(syscall.Mount("proc", "proc", "proc", 0, ""))
        	check(syscall.Mount("godir", "temp", "tmpfs", 0, ""))
        	check(cmd.Run())
        	check(syscall.Unmount("proc", 0))
        	check(syscall.Unmount("temp", 0))
        }

        func check(err error) {
        	if err != nil {
        		logrus.Errorln(err)
        	}
        }



&nbsp;&nbsp;&nbsp;&nbsp;执行mkdir /tmp/busybox/temp命令在busybox解压的目录创建挂载目录，这里涉及到chroot知识。然后执行go run Mount_001.go run 后使用mount命令查看已挂载的文件系统.

PID_001.go:

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_pid_003.png| Img of Hugo website"
>}}

Mount_001.go:

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_mount_001.png| Img of Hugo website"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;继续执行touch /temp/godir 在temp目录下创建一个文件。然后在主机中执行ls /root/busybox/temp可以看到刚刚创建的文件。这是因为现在还没有添加挂载点的隔离。

Mount_001.go:

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_mount_002.png| Img of Hugo website"
>}}

宿主机：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_mount_003.png| Img of Hugo website"
>}}


&nbsp;&nbsp;&nbsp;&nbsp;将Cloneflags更新为Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWPID | syscall.CLONE_NEWNS,再次重复上面的步骤，主机中将不能再看到容器内创建的文件。这里mount point的隔离所使用的flag是CLONE_NEWNS，因为它是Linux实现的第一个namespace, 人们也没有意识到将来会有更多的namespace。

&nbsp;&nbsp;&nbsp;&nbsp;此时在主机上再调用mount也不能看到容器中的挂载情况，但是可以通过/proc/<pid>/mounts这个文件查看。

&nbsp;&nbsp;&nbsp;&nbsp;在容器中执行sleep 1000创建一个耗时1000秒的进程。然后在主机上通过pidof sleep获取这个进程的pid，接下来查看这个进程的挂载情况。
        $ sleep 10000&
        $ pidof sleep
        6
        $ cat /proc/6/mounts
        proc /proc proc rw,relatime 0 0
        godir /temp tmpfs rw,relatime 0 0

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_mount_004.png| Img of Hugo website"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;/proc/\<pid>/下的文件还记录了这个进程的其他信息，比如/proc/\<pid>/environ记录了它的环境变量，可以通过cat /proc/\<pid>/environ | tr '\n' '\0'查看，tr '\n' '\0'去掉字符间多余的空格。

#### 4). User

&nbsp;&nbsp;&nbsp;&nbsp;在golang的GOPATH目录下的src创建一个User_001目录,将上面代码修改如下并写入User_001/User_001.go,为了代码整洁，这边引入了"github.com/docker/docker/pkg/reexec"包，代码修改为：

        package main
        import (
        	"flag"
        	"os"
        	"os/exec"
        	"syscall"

        	"github.com/docker/docker/pkg/reexec"
        	"github.com/sirupsen/logrus"
        )

        func init() {
        	reexec.Register("nsInitialisation", nsInit)
        	if reexec.Init() {
        		os.Exit(0)
        	}
        }

        func main() {
        	var nsShell, nsHostName, rootPath string
        	flag.StringVar(&nsShell, "nsshell", "/bin/sh", "The path to the shell where the namespace is running")
        	flag.StringVar(&nsHostName, "nshostname", "nshost", "Path to the shell to use")
        	flag.StringVar(&rootPath, "rootfs", "/tmp/busybox", "Path to the root filesystem to use")
        	flag.Parse()
        	cmd := reexec.Command("nsInitialisation", nsShell, nsHostName, rootPath)
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	cmd.SysProcAttr = &syscall.SysProcAttr{
        		Cloneflags: syscall.CLONE_NEWNS |
        			syscall.CLONE_NEWUTS |
        			syscall.CLONE_NEWPID,
        	}
        	check(cmd.Run())
        }

        //nsInit ns初始化
        func nsInit() {
        	command := os.Args[1]
        	hostname := os.Args[2]
        	newRootPath := os.Args[3]
        	mountRoot(newRootPath)
        	chRoot(command, newRootPath)
        	nsRun(command, hostname, newRootPath)
        }

        func nsRun(command, hostname, newRootPath string) {
        	cmd := exec.Command(command)
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	check(syscall.Sethostname([]byte(hostname)))
        	check(cmd.Run())
        	check(syscall.Unmount("proc", 0))
        	check(syscall.Unmount("temp", 0))
        }

        func mountRoot(newroot string) {
        	check(syscall.Chroot(newroot))
        	check(os.Chdir("/"))
        }

        func chRoot(command, newroot string) {
        	cmd := exec.Command(command)
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	check(syscall.Mount("proc", "proc", "proc", 0, ""))
        	check(syscall.Mount("godir", "temp", "tmpfs", 0, ""))
        }

        func check(err error) {
        	if err != nil {
        		logrus.Errorln(err)
        	}
        }
&nbsp;&nbsp;&nbsp;&nbsp;只是代码的结构改变了，原理还是不变的。以前执行golang代码时必须使用root权限，如果使用普通用户权限就会报错，错误内容一般是权限不足之类的，如下图：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_user_001.png| Img of Hugo website"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;我们尝试将Cloneflags更新为Cloneflags: syscall.CLONE_NEWUTS |syscall.CLONE_NEWUSER| syscall.CLONE_NEWPID | syscall.CLONE_NEWNS . 执行命令 go run User_001.go,出现以下报错，但是提示符由#变为$，而且也正常进入ns里的shell.如下图：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_user_002.png| Img of Hugo website"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;那怎么解决这个问题，并能在普通用户下执行代码，并已root权限进入ns里。这里需要使用还需要所谓的UID和GID映射,我们先了解一下什么是UID和GID映射。

* User命名空间提供UID和GID的隔离
* 在任何给定时间，在同一主机上可以使用多个不同的用户名称空间
* 每个Linux进程都在其中一个用户名称空间中运行
* 用户命名空间允许用户命名空间1中的进程的UID与用户命名空间2中的相同进程的UID不同
* UID/GID映射提供了一种在两个单独的用户名称空间之间映射ID的机制


如果不理解我们看图。

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_user_003.jpeg| Img of Hugo website"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;图为两个用户名称空间，1和2，以及相应的UID和GID表。请注意，以非root用户身份运行的进程C能够生成以root身份运行的进程D.

&nbsp;&nbsp;&nbsp;&nbsp;关键的实现细节以及防止Universe崩溃的事情是两个用户命名空间之间的映射（这里用虚线表示）。
进程D仅在用户名称空间2的上下文中具有root权限。从用户名称空间1中的进程的角度来看，进程D作为非root用户运行，因此，没有那些所有重要的root权限。

&nbsp;&nbsp;&nbsp;&nbsp;这正式我们应用所缺少的。我们可以通过syscall包中的syscall.SysProcAttr中的两个结构体
设UidMappings和GidMappings来实现。

修改cmd.SysProcAttr为：

        cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWNS |
			syscall.CLONE_NEWUTS |
			syscall.CLONE_NEWPID |
			syscall.CLONE_NEWUSER,
		UidMappings: []syscall.SysProcIDMap{
			{
				ContainerID: 0,
				HostID:      os.Getuid(),
				Size:        1,
			},
		},
		GidMappings: []syscall.SysProcIDMap{
			{
				ContainerID: 0,
				HostID:      os.Getgid(),
				Size:        1,
			},
		},
	}

&nbsp;&nbsp;&nbsp;&nbsp;这里我们添加一个UID和GID映射。我们将ContainerID设置为0,HostID设置为当前用户的UID/GID，Size设置为1.换句话说，我们将新的User命名空间中的ID = 0（也称为root）映射到该宿主机运行代码用户的ID。我们来测试一下，运行代码go run User_001.go.效果如下：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_user_004.png| Img of Hugo website"
>}}

#### 5). Network

&nbsp;&nbsp;&nbsp;&nbsp;在golang的GOPATH目录下的src创建一个Network_001目录,将上面Mount_001.go代码写入Network_001/Network_001.go,并修改cmd.SysProcAttr为：

	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWNS |
			syscall.CLONE_NEWUTS |
			syscall.CLONE_NEWPID |
			syscall.CLONE_NEWNET |
			syscall.CLONE_NEWUSER,
		UidMappings: []syscall.SysProcIDMap{
			{
				ContainerID: 0,
				HostID:      os.Getuid(),
				Size:        1,
			},
		},
		GidMappings: []syscall.SysProcIDMap{
			{
				ContainerID: 0,
				HostID:      os.Getgid(),
				Size:        1,
			},
		},
	}

运行代码，go run Network_001.go,并使用命令 ip addr查看IP地址，具体如下：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_network_001.png| Img of Hugo website"
>}}

我们发现只有回环地址，如果我们要和主机或其它network的网络命名空间通讯怎么办，具体的实现原理我这里面不作解释，具体内容在后面容器网络会有说明，主要是veth对.执行以下命令：

        $ wget https://github.com/teddyking/netsetgo/releases/download/0.0.1/netsetgo 
        $ cp netsetgo /tmp/
        $ sudo chown root:root /tmp/netsetgo
        $ sudo chmod 4755 /tmp/netsetgo

修改代码为：

        package main

        import (
        	"flag"
        	"fmt"
        	"net"
        	"os"
        	"os/exec"
        	"syscall"
        	"time"

        	"github.com/docker/docker/pkg/reexec"
        	"github.com/sirupsen/logrus"
        )

        func init() {
        	reexec.Register("nsInitialisation", nsInit)
        	if reexec.Init() {
        		os.Exit(0)
        	}
        }


        func check(err error) {
        	if err != nil {
        		logrus.Errorln(err)
        	}
        }

        func main() {
        	var nsShell, nsHostName, rootPath, netsetgoPath string
        	flag.StringVar(&nsShell, "nsshell", "/bin/sh", "The path to the         shell where the namespace is running")
        	flag.StringVar(&nsHostName, "nshostname", "nshost", "Path to the        shell to use")
        	flag.StringVar(&rootPath, "rootfs", "/tmp/busybox", "Path to the        root filesystem to use")
        	flag.StringVar(&netsetgoPath, "netsetgo", "/tmp/netsetgo", "Path        to the netsetgo binary")
        	flag.Parse()
        	cmd := reexec.Command("nsInitialisation", nsShell, nsHostName,  rootPath)
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	cmd.SysProcAttr = &syscall.SysProcAttr{
        		Cloneflags: syscall.CLONE_NEWNS |
        			syscall.CLONE_NEWUTS |
        			syscall.CLONE_NEWPID |
        			syscall.CLONE_NEWNET |
        			syscall.CLONE_NEWUSER,
        		UidMappings: []syscall.SysProcIDMap{
        			{
        				ContainerID: 0,
        				HostID:      os.Getuid(),
        				Size:        1,
        			},
        		},
        		GidMappings: []syscall.SysProcIDMap{
        			{
        				ContainerID: 0,
        				HostID:      os.Getgid(),
        				Size:        1,
        			},
        		},
        	}

        	check(cmd.Start())
        	//netsetgo 必须使用root权限运行，而且要注意setuid的权限
        	pid := fmt.Sprintf("%d", cmd.Process.Pid)
        	netsetgoCmd := exec.Command(netsetgoPath, "-pid", pid)
        	check(netsetgoCmd.Run())
        	check(cmd.Wait())

        }

        //nsInit ns初始化
        func nsInit() {
        	command := os.Args[1]
        	hostname := os.Args[2]
        	newRootPath := os.Args[3]
        	mountRoot(newRootPath)
        	chRoot(command, newRootPath)
        	check(waitForNetwork())
        	nsRun(command, hostname, newRootPath)
        }

        func nsRun(command, hostname, newRootPath string) {
        	cmd := exec.Command(command)
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	check(syscall.Sethostname([]byte(hostname)))
        	check(cmd.Run())
        	check(syscall.Unmount("proc", 0))
        }

        func mountRoot(newroot string) {
        	check(syscall.Chroot(newroot))
        	check(os.Chdir("/"))
        }

        func chRoot(command, newroot string) {
        	cmd := exec.Command(command)
        	cmd.Stdin = os.Stdin
        	cmd.Stdout = os.Stdout
        	cmd.Stderr = os.Stderr
        	check(syscall.Mount("proc", "proc", "proc", 0, ""))
        }

        func waitForNetwork() error {
        	maxWait := time.Second * 3
        	checkInterval := time.Second
        	timeStarted := time.Now()
        	for {
        		interfaces, err := net.Interfaces()
        		if err != nil {
        			return err
        		}
        		// pretty basic check ...
        		// > 1 as a lo device will already exist
        		if len(interfaces) > 1 {
        			return nil
        		}
        		if time.Since(timeStarted) > maxWait {
        			return fmt.Errorf("Timeout after %s waiting for network", maxWait)
        		}
        		time.Sleep(checkInterval)
        	}
        }

&nbsp;&nbsp;&nbsp;&nbsp;netsetgo需要对主机的网络命名空间以及新的网络命名空间进行配置，这意味着我们不能再依赖cmd.Run(),我们查看一下exec包，可以发现cmd.Start()（立即启动）和cmd.Wait()（阻塞直到启动的命令退出),这正是我们所需要的，因为它允许我们在使用netsetgo创建新命名空间之后仍能在主机命名空间中执行。还有一个问题，如何在网络初始化完成后才能运行命名空间的/bin/sh,这里使用的阻塞运行，我们新建立一个waitForNetwork函数利用for循环判断网络是否初始化完成，初始化完成程序会继续往下运行。我们尝试运行一下:

        $ go build
        $ ./Network_001

Network_001.go:

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_network_002.png| Img of Hugo website"
>}}

宿主机：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_network_003.png| Img of Hugo website"
>}}

如果我们想使Network_001连接互联网我们可以使用以下命令：

        $ sudo iptables -tnat -N netsetgo
        $ sudo iptables -tnat -A PREROUTING -m addrtype --dst-type LOCAL -j     netsetgo
        $ sudo iptables -tnat -A OUTPUT ! -d 10.0.2.15/24 -m addrtype --dst-type        LOCAL -j netsetgo
        $ sudo iptables -tnat -A POSTROUTING -s 10.10.10.0/24 ! -o brg0 -j      MASQUERADE
        $ sudo iptables -tnat -A netsetgo -i brg0 -j RETURN

然后再Network_001上执行

        $ echo "nameserver 114.114.114.114" >> /etc/resolv.conf

网络方面讲的比较粗，后面会再讲docker网络的时候再执行说明一下。

#### 6). IPC

&nbsp;&nbsp;&nbsp;&nbsp;在golang的GOPATH目录下的src创建一个IPC_001目录,将上面IPC_001.go代码写入IPC_001/IPC_001.go,由于IPC很不好演示，因为IPC本身的情况导致不能直观的查看，只能通过执行ls -l /proc/$$/ns命令查看,修改cmd.SysProcAttr为：

        cmd.SysProcAttr = &syscall.SysProcAttr{
                		Cloneflags: syscall.CLONE_NEWNS |
                			syscall.CLONE_NEWUTS |
                			syscall.CLONE_NEWPID |
                                        syscall.CLONE_NEWIPC |
                			syscall.CLONE_NEWNET |
                			syscall.CLONE_NEWUSER,
                		UidMappings: []syscall.SysProcIDMap{
                			{
                				ContainerID: 0,
                				HostID:      os.Getuid(),
                				Size:        1,
                			},
                		},
                		GidMappings: []syscall.SysProcIDMap{
                			{
                				ContainerID: 0,
                				HostID:      os.Getgid(),
                				Size:        1,
                			},
                		},
                	}

编译，运行:

        $ go build 
        $ ./IPC_001

使用 ls -l /proc/$$/ns命令对比:

IPC_001.go:

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_ipc_001.png| Img of Hugo website"
>}}

宿主机：

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/002/namespaces_golang_ipc_002.png| Img of Hugo website"
>}}

我们会发现所有项目都不同。而对比UTS那几张图会发现其中的差异。

#### 7). Cgroups

cgroups可以用于限制namespace隔离起来的资源，为资源设置权重，计算使用量，操控任务启停

Cgroups组件:

        cgroup: 		cgroup是对进程分组管理的一种机制，一个cgroup包含一组进程，并可以在这个cgroup上增加Subsystem的配置
        Subsystem: 		资源控制的模块，包括
        blkio： 		块设备io控制
        cpu：			CPU调度策略
        cpuacct: 		进程的CPU占用
        cpuset: 		进程可使用的CPU和内存
        devices: 		 控制进程对内存的访问
        freezer: 		挂起和恢复进程
        memory: 		控制进程的内存占用
        net_cls: 		将网络包分类，使traffic controller可以区分出网络包来自哪个cgroup并做限流       和监控
        net_prio: 		设置进程产生的网络流量的优先级
        ns：			使cgroup中的进程在新的namespace中fork新进程时创建出一个新的cgroup(包含新的  namespace中的进程)
        hierarchy: 		将一组cgroup变成树状结构，便于Cgroups继承。

资源限制:

&nbsp;&nbsp;&nbsp;&nbsp;可以通过mount | grep cgroup查看已挂载的subsystem。cgroup相关的文件在/sys/fs/cgroup下，如果使用了docker的话在这个目录下还会有一个docker目录，其中是docker的cgroup的相关文件,定义一个新的函数cg(), 限制容器的最大进程数:

	func cg() {
		cgPath := "/sys/fs/cgroup/"
		pidsPath := filepath.Join(cgPath, "pids")
		// 在/sys/fs/cgroup/pids下创建container目录
		os.Mkdir(filepath.Join(pidsPath, "container"), 0775)
		if !Exists(filepath.Join(pidsPath, "container")) {
			os.MkdirAll(filepath.Join(pidsPath, "container"), os.ModePerm)
			fmt.Printf("file is on:%s", filepath.Join(pidsPath, "container"))
		}
		// 设置最大进程数目为20
		check(ioutil.WriteFile(filepath.Join(pidsPath, "container/pids.max"), []byte("20"), 0777))
		// 将notify_on_release值设为1，当cgroup不再包含任何任务的时候将执行release_agent的内容
		check(ioutil.WriteFile(filepath.Join(pidsPath, "container/notify_on_release"), []byte("1"), 0777))
		// 加入当前正在执行的进程
		fmt.Println(os.Getpid())
		check(ioutil.WriteFile(filepath.Join(pidsPath, "container/cgroup.procs"), []byte(strconv.Itoa(os.Getpid())), 0777))
	}

完整代码为：

	package main

	import (
		"flag"
		"fmt"
		"io/ioutil"
		"net"
		"os"
		"os/exec"
		"path/filepath"
		"strconv"
		"syscall"
		"time"

		"github.com/docker/docker/pkg/reexec"
		"github.com/sirupsen/logrus"
	)

	func init() {
		reexec.Register("nsInitialisation", nsInit)
		if reexec.Init() {
			os.Exit(0)
		}
	}

	func check(err error) {
		if err != nil {
			logrus.Errorln(err)
		}
	}

	/*

	mkdir /tmp/busybox
	tar xf busybox.tar -C /tmp/busybox/
	cp netsetgo /tmp/
	sudo chown root:root /tmp/netsetgo
	sudo chmod 4755 /tmp/netsetgo

	*/
	func main() {
		var nsShell, nsHostName, rootPath, netsetgoPath string
		flag.StringVar(&nsShell, "nsshell", "/bin/sh", "The path to the shell where the namespace is running")
		flag.StringVar(&nsHostName, "nshostname", "nshost", "Path to the shell to use")
		flag.StringVar(&rootPath, "rootfs", "/tmp/busybox", "Path to the root filesystem to use")
		flag.StringVar(&netsetgoPath, "netsetgo", "/tmp/netsetgo", "Path to the netsetgo binary")
		flag.Parse()
		cg()
		cmd := reexec.Command("nsInitialisation", nsShell, nsHostName, rootPath)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.SysProcAttr = &syscall.SysProcAttr{
			Cloneflags: syscall.CLONE_NEWNS |
				syscall.CLONE_NEWUTS |
				syscall.CLONE_NEWPID |
				syscall.CLONE_NEWIPC |
				syscall.CLONE_NEWNET |
				syscall.CLONE_NEWUSER,
			UidMappings: []syscall.SysProcIDMap{
				{
					ContainerID: 0,
					HostID:      os.Getuid(),
					Size:        1,
				},
			},
			GidMappings: []syscall.SysProcIDMap{
				{
					ContainerID: 0,
					HostID:      os.Getgid(),
					Size:        1,
				},
			},
		}

		check(cmd.Start())
		//netsetgo 必须使用root权限运行，而且要注意setuid的权限
		pid := fmt.Sprintf("%d", cmd.Process.Pid)
		netsetgoCmd := exec.Command(netsetgoPath, "-pid", pid)
		check(netsetgoCmd.Run())
		check(cmd.Wait())

	}

	//nsInit ns初始化
	func nsInit() {
		command := os.Args[1]
		hostname := os.Args[2]
		newRootPath := os.Args[3]
		mountRoot(newRootPath)
		chRoot(command, newRootPath)
		check(waitForNetwork())
		nsRun(command, hostname, newRootPath)
	}

	func nsRun(command, hostname, newRootPath string) {
		cmd := exec.Command(command)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		check(syscall.Sethostname([]byte(hostname)))
		check(cmd.Run())
		check(syscall.Unmount("proc", 0))
		check(syscall.Unmount("temp", 0))
	}

	func mountRoot(newroot string) {
		check(syscall.Chroot(newroot))
		check(os.Chdir("/"))
	}

	func chRoot(command, newroot string) {
		cmd := exec.Command(command)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		check(syscall.Mount("proc", "proc", "proc", 0, ""))
		check(syscall.Mount("godir", "tmp", "tmpfs", 0, ""))


	}

	func waitForNetwork() error {
		maxWait := time.Second * 3
		checkInterval := time.Second
		timeStarted := time.Now()
		for {
			interfaces, err := net.Interfaces()
			if err != nil {
				return err
			}
			// pretty basic check ...
			// > 1 as a lo device will already exist
			if len(interfaces) > 1 {
				return nil
			}
			if time.Since(timeStarted) > maxWait {
				return fmt.Errorf("Timeout after %s waiting for network", maxWait)
			}
			time.Sleep(checkInterval)
		}
	}

	/*
	#!/bin/sh
	d() { /bin/sleep 1000; }
	for i in $(seq 1 100)
	do
	    echo "sleep $i\n"
	    d&
	done
	*/

	func cg() {
		cgPath := "/sys/fs/cgroup/"
		pidsPath := filepath.Join(cgPath, "pids")
		// 在/sys/fs/cgroup/pids下创建container目录
		os.Mkdir(filepath.Join(pidsPath, "container"), 0775)
		if !Exists(filepath.Join(pidsPath, "container")) {
			os.MkdirAll(filepath.Join(pidsPath, "container"), os.ModePerm)
			fmt.Printf("file is on:%s", filepath.Join(pidsPath, "container"))
		}

由于要修改sys目录文件所以这个时候需要root执行：

	$ go build .
	$ sudo ./Cgroup_001 

如果没有报异常说明运行成功，并在主机的/sys/fs/cgroup/pids/container目录可以看到cgroup的限制文件。进入容器并创建脚本：

	$ vi /tmp/1.sh
	d() { sleep 1000; }
	for i in $(seq 1 100)
	do
    	echo "sleep $i\n"
    	d&
	done
	$ sh /tmp/1.sh

&nbsp;&nbsp;&nbsp;&nbsp;执行后现象与不做限制进行对比会发现运行的进程数目变少了好多。好了！这次学习在此结束，cgroup的内容实在是太多，这次只是PID相关的，后面会在额外的文章中说明。

---
## 结束

参考文章：

1> https://juejin.im/entry/59abdb83f265da249412463a

2> https://segmentfault.com/a/1190000007468509

3> https://github.com/teddyking/ns-process

4> http://manpages.ubuntu.com/manpages/bionic/man2/clone.2.html

源码链接：

1> https://github.com/allposs/learning