---
title:          007-Linux常用命令合集
date:           2020-08-18T14:20:23+08:00
draft:          true
tags:           [2020-08]
topics:         [linux,命令]
---
## 简介
    
&nbsp;&nbsp;&nbsp;&nbsp;本文是用来记录一些自己常用到的一些linux命令的合集文章,方便自己查询与记录。

<!--more-->
## 环境

无

## 软件包

无

## 拓扑图

无

## 正文
---

### 1. pstree

#### 简介:

将正在运行的进程显示为树。它用作ps命令的更直观的替代方法。树的根是init或具有给定pid的进程。也可以将其安装在其他Unix系统中。在BSD系统中，使用创建类似的输出`ps -d`，在Linux `ps axjf`中产生类似的输出

#### 安装方式:

    MAC OS 
    # brew install pstree
 
    Fedora/Red Hat/CentOS
    # yum install psmisc
 
    Ubuntu/Debian
    # apt-get install psmisc

#### 语法:

    # pstree  (选项)  

#### 选项:

    -a 　显示每个程序的完整指令，包含路径，参数或是常驻服务的标示。
    -c 　不使用精简标示法。
    -G 　使用VT100终端机的列绘图字符。
    -h 　列出树状图时，特别标明执行的程序。
    -H<程序识别码> 　此参数的效果和指定"-h"参数类似，但特别标明指定的程序。
    -l 　采用长列格式显示树状图。
    -n 　用程序识别码排序。预设是以程序名称来排序。
    -p 　显示程序识别码。
    -u 　显示用户名称。
    -U 　使用UTF-8列绘图字符。
    -V 　显示版本信息。

#### 参数:


#### 实例:

    # pstree

#### 相关网站:

* [man1](https://linux.die.net/man/1/pstree)


### 2. strace 

#### 简介:

strace常用来跟踪进程执行时的系统调用和所接收的信号。 在Linux世界，进程不能直接访问硬件设备，当进程需要访问硬件设备(比如读取磁盘文件，接收网络数据等等)时，必须由用户态模式切换至内核态模式，通 过系统调用访问硬件设备。strace可以跟踪到一个进程产生的系统调用,包括参数，返回值，执行消耗的时间。

#### 安装方式:

    MAC OS 
    # brew install strace
 
    Fedora/Red Hat/CentOS
    # yum install strace
 
    Ubuntu/Debian
    # apt-get install strace

#### 语法:

    # strace  [  -dffhiqrtttTvxx  ] [ -acolumn ] [ -eexpr ] ...
    [ -ofile ] [-ppid ] ...  [ -sstrsize ] [ -uusername ]
    [ -Evar=val ] ...  [ -Evar  ]...
    [ command [ arg ...  ] ]

    # strace  -c  [ -eexpr ] ...  [ -Ooverhead ] [ -Ssortby ]
    [ command [ arg...  ] ]

#### 选项：

    -c 统计每一系统调用的所执行的时间,次数和出错的次数等. 
    -d 输出strace关于标准错误的调试信息. 
    -f 跟踪由fork调用所产生的子进程. 
    -ff 如果提供-o filename,则所有进程的跟踪结果输出到相应的filename.pid中,pid是各进程的进程号. 
    -F 尝试跟踪vfork调用.在-f时,vfork不被跟踪. 
    -h 输出简要的帮助信息. 
    -i 输出系统调用的入口指针. 
    -q 禁止输出关于脱离的消息. 
    -r 打印出相对时间关于,,每一个系统调用. 
    -t 在输出中的每一行前加上时间信息. 
    -tt 在输出中的每一行前加上时间信息,微秒级. 
    -ttt 微秒级输出,以秒了表示时间. 
    -T 显示每一调用所耗的时间. 
    -v 输出所有的系统调用.一些调用关于环境变量,状态,输入输出等调用由于使用频繁,默认不输出. 
    -V 输出strace的版本信息. 
    -x 以十六进制形式输出非标准字符串 
    -xx 所有字符串以十六进制形式输出. 
    -a column 
    设置返回值的输出位置.默认 为40. 
    -e expr 
    指定一个表达式,用来控制如何跟踪.格式如下: 
    [qualifier=][!]value1[,value2]... 
    qualifier只能是 trace,abbrev,verbose,raw,signal,read,write其中之一.value是用来限定的符号或数字.默认的 qualifier是 trace.感叹号是否定符号.例如: 
    -eopen等价于 -e trace=open,表示只跟踪open调用.而-etrace!=open表示跟踪除了open以外的其他调用.有两个特殊的符号 all 和 none. 
    注意有些shell使用!来执行历史记录里的命令,所以要使用\\. 
    -e trace=set 
    只跟踪指定的系统 调用.例如:-e trace=open,close,rean,write表示只跟踪这四个系统调用.默认的为set=all. 
    -e trace=file 
    只跟踪有关文件操作的系统调用. 
    -e trace=process 
    只跟踪有关进程控制的系统调用. 
    -e trace=network 
    跟踪与网络有关的所有系统调用. 
    -e strace=signal 
    跟踪所有与系统信号有关的 系统调用 
    -e trace=ipc 
    跟踪所有与进程通讯有关的系统调用 
    -e abbrev=set 
    设定 strace输出的系统调用的结果集.-v 等与 abbrev=none.默认为abbrev=all. 
    -e raw=set 
    将指 定的系统调用的参数以十六进制显示. 
    -e signal=set 
    指定跟踪的系统信号.默认为all.如 signal=!SIGIO(或者signal=!io),表示不跟踪SIGIO信号. 
    -e read=set 
    输出从指定文件中读出 的数据.例如: 
    -e read=3,5 
    -e write=set 
    输出写入到指定文件中的数据. 
    -o filename 
    将strace的输出写入文件filename 
    -p pid 
    跟踪指定的进程pid. 
    -s strsize 
    指定输出的字符串的最大长度.默认为32.文件名一直全部输出. 
    -u username 
    以username 的UID和GID执行被跟踪的命令

#### 参数:


#### 实例:

    跟踪28979进程的所有系统调用（-e trace=all），并统计系统调用的花费时间，以及开始时间（并以可视化的时分秒格式显示），最后将记录结果存在output.txt文件里面。
    # strace -o output.txt -T -tt -e trace=all -p 28979
    

#### 相关网站:

* [官网](https://strace.io/)
* [详细](https://man.linuxde.net/strace)


### 3. sar

#### 简介:
sar命令是Linux下系统运行状态统计工具，它将指定的操作系统状态计数器显示到标准输出设备。sar工具将对系统当前的状态进行取样，然后通过计算数据和比例来表达系统的当前运行状态。它的特点是可以连续对系统取样，获得大量的取样数据。取样数据和分析的结果都可以存入文件，使用它时消耗的系统资源很小。

#### 安装方式:

    MAC OS 
    # brew install sysstat
 
    Fedora/Red Hat/CentOS
    # yum install sysstat
 
    Ubuntu/Debian
    # apt-get install sysstat

    启用sa日志方法
    CentOS/Red Hat/默认启动

#### 语法:

    sar(选项)(参数)

#### 选项：

    -A 汇总所有的报告
    -a 报告文件读写使用情况
    -B 报告附加的缓存的使用情况
    -b 报告缓存的使用情况
    -c 报告系统调用的使用情况
    -d 报告磁盘的使用情况
    -g 报告串口的使用情况
    -h 报告关于buffer使用的统计数据
    -m 报告IPC消息队列和信号量的使用情况
    -n 报告命名cache的使用情况
    -p 报告调页活动的使用情况
    -q 报告运行队列和交换队列的平均长度
        runq-sz：运行队列的长度（等待运行的进程数）
        plist-sz：进程列表中进程（processes）和线程（threads）的数量
        ldavg-1：最后1分钟的系统平均负载 
        ldavg-5：过去5分钟的系统平均负载
        ldavg-15：过去15分钟的系统平均负载
    -R 报告进程的活动情况
    -r 报告没有使用的内存页面和硬盘块
        kbmemfree：这个值和free命令中的free值基本一致,所以它不包括buffer和cache的空间.
        kbmemused：这个值和free命令中的used值基本一致,所以它包括buffer和cache的空间.
        %memused：物理内存使用率，这个值是kbmemused和内存总量(不包括swap)的一个百分比.
        kbbuffers和kbcached：这两个值就是free命令中的buffer和cache.
        kbcommit：保证当前系统所需要的内存,即为了确保不溢出而需要的内存(RAM+swap).
        %commit：这个值是kbcommit与内存总量(包括swap)的一个百分比.
    -u 报告CPU的利用率
        %user 用户模式下消耗的CPU时间的比例；
        %nice 通过nice改变了进程调度优先级的进程，在用户模式下消耗的CPU时间的比例
        %system 系统模式下消耗的CPU时间的比例；
        %iowait CPU等待磁盘I/O导致空闲状态消耗的时间比例；
        %steal 利用Xen等操作系统虚拟化技术，等待其它虚拟CPU计算占用的时间比例；
        %idle CPU空闲时间比例；
    -v 报告进程、i节点、文件和锁表状态
    -w 报告系统交换活动状况
        pswpin/s：每秒系统换入的交换页面（swap page）数量
        pswpout/s：每秒系统换出的交换页面（swap page）数量
    -y 报告TTY设备活动状况
    -f 报告sa日志的相关性能记录

#### 参数:

  * 间隔时间：每次报告的间隔时间（秒）；
  * 次数：显示报告的次数。

#### 实例:

    查看运行队列中的进程数、系统上的进程大小、平均负载等
    # sar -q  1  60

    查看日志里运行队列中的进程数、系统上的进程大小、平均负载等
    # sar -q -f /var/log/sa/sa20

#### 相关网站:

* [详细](https://linux.die.net/man/1/sar)



    ### <序号>. <命令名称>
    #### 简介:
    #### 安装方式:
    #### 语法:
    #### 选项：
    #### 参数:
    #### 实例:
    #### 相关网站:

---
## 结束

PS: 

推荐一些命令信息查询网址：

*[linux.die.net](https://linux.die.net/man/)    -- 官网
*[man.linuxde.net](https://man.linuxde.net/strace) -- 相关数据较为不全