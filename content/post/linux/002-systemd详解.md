---
title:          001-Systemd详解
date:           2016-05-24T14:20:23+08:00
draft:          true
tags:           [2016-05]
topics:         [Linux,Systemd]
---

## 简介

&#160; &#160; &#160; &#160;CentOS 与RedHat 的7.x系统都采用systemd替换了SysV。Systemd目的是要取代Unix时代以来一直在使用的init系统，兼容SysV和LSB的启动脚本，而且够在进程启动过程中更有效地引导加载服务。
systemd的特性有：
1. 支持并行化任务
1. 同时采用socket式与D-Bus总线式激活服务；
1. 按需启动守护进程（daemon）；
1. 利用 Linux 的 cgroups 监视进程；
1. 支持快照和系统恢复；
1. 维护挂载点和自动挂载点；
1. 各服务间基于依赖关系进行精密控制。

<!--more-->
## 版本

RedHat7.*

## 正文
---
### 初步介绍systemd
### 1. systemd工具
&#160; &#160; &#160; &#160;检查和控制systemd的主要命令是systemctl。该命令用于查看系统状态和管理系统及服务。

注:

&#160; &#160; &#160; &#160;1.在 systemctl 参数中添加 -H <用户名>@<主机名> 可以实现对其他机器的远程控制。该过程使用ssh链接。

&#160; &#160; &#160; &#160;2.systemadm 是 systemd 的官方图形前端。

&#160; &#160; &#160; &#160;3.systemadm是以单元的形式查看系统状态和管理系统及服务。

&#160; &#160; &#160; &#160;4.systemctl --type=单位类型，用来过滤单位
  

### 2. 单元的简单介绍

&#160; &#160; &#160; &#160;一个单元配置文件可以描述如下内容之一：系统服务（.service）、挂载点（.mount）、sockets（.sockets 、系统设备、交换分区/文件、启动目标（target）、文件系统路径、由 systemd 管理的计时器。

&#160; &#160; &#160; &#160;每个单元都有一个对应的配置文件，系统管理员的任务就是编写和维护这些不同的配置文件，比如一个 MySQL 服务对应一个 mysql.service 文件。这种配置文件的语法非常简单，用户不需要再编写和维护复杂的系统 脚本了。单元文件详解：

&#160; &#160; &#160; &#160;•	service ：代表一个后台服务进程，比如 mysqld，这是最常用的一类。

&#160; &#160; &#160; &#160;•	socket ：此类配置单元封装系统和互联网中的一个 套接字 。当下，systemd 支持流式、数据报和连续包的 AF_INET、AF_INET6、AF_UNIX socket 。每一个套接字配置单元都有一个相应的服务配置单元 。相应的服务在第一个"连接"进入套接字时就会启动(例如：nscd.socket 在有新连接后便启动 nscd.service)。

&#160; &#160; &#160; &#160;•	device ：此类配置单元封装一个存在于 Linux 设备树中的设备。每一个使用 udev 规则标记的设备都将会在 systemd 中作为一个设备配置单元出现。

&#160; &#160; &#160; &#160;•	mount ：此类配置单元封装文件系统结构层次中的一个挂载点。Systemd 将对这个挂载点进行监控和管理。比如可以在启动时自动将其挂载；可以在某些条件下自动卸载。Systemd 会将/etc/fstab 中的条目都转换为挂载点，并在开机时处理。

&#160; &#160; &#160; &#160;•	automount ：此类配置单元封装系统结构层次中的一个自挂载点。每一个自挂载配置单元对应一个挂载配置单元 ，当该自动挂载点被访问时，systemd 执行挂载点中定义的挂载行为。

&#160; &#160; &#160; &#160;•	swap: 和挂载配置单元类似，交换配置单元用来管理交换分区。用户可以用交换配置单元来定义系统中的交换分区，可以让这些交换分区在启动时被激活。

&#160; &#160; &#160; &#160;•	target ：此类配置单元为其他配置单元进行逻辑分组。它们本身实际上并不做什么，只是引用其他配置单元而已。这样便可以对配置单元做一个统一的控制。这样就可以实 现大家都已经非常熟悉的运行级别概念。比如想让系统进入图形化模式，需要运行许多服务和配置命令，这些操作都由一个个的配置单元表示，将所有这些配置单元 组合为一个目标(target)，就表示需要将这些配置单元全部执行一遍以便进入目标所代表的系统运行状态。 (例如：multi-user.target 相当于在传统使用 SysV 的系统中运行级别 5)

&#160; &#160; &#160; &#160;•	timer：定时器配置单元用来定时触发用户定义的操作，这类配置单元取代了 atd、crond 等传统的定时服务。

&#160; &#160; &#160; &#160;•	snapshot ：与 target 配置单元相似，快照是一组配置单元。它保存了系统当前的运行状态。

&#160; &#160; &#160; &#160;详情参阅 man 5 systemd.unit.使用 systemctl 控制单元时，通常需要使用单元文件的全名，包括扩展名（例如 sshd.service）。但是有些单元可以在systemctl中使用简写方式。

&#160; &#160; &#160; &#160;•	如果无扩展名，systemctl 默认把扩展名当作 .service。例如 netcfg 和 netcfg.service 是等价的。

&#160; &#160; &#160; &#160;•	挂载点会自动转化为相应的 .mount 单元。例如 /home 等价于 home.mount。

&#160; &#160; &#160; &#160;•	设备会自动转化为相应的 .device 单元，所以 /dev/sda2 等价于 dev-sda2.device。

### 3. 依赖关系

&#160; &#160; &#160; &#160;虽然 systemd 将大量的启动工作解除了依赖，使得它们可以并发启动。但还是存在有些任务，它们之间存在天生的依赖，不能用"套接字激活"(socket activation)、D-Bus activation 和 autofs 三大方法来解除依赖（三大方法详情见后续描述）。比如：挂载必须等待挂载点在文件系统中被创建；挂载也必须等待相应的物理设备就绪。为了解决这类依赖问 题，systemd 的配置单元之间可以彼此定义依赖关系。

&#160; &#160; &#160; &#160;Systemd 用配置单元定义文件中的关键字来描述配置单元之间的依赖关系。比如：unit A 依赖 unit B，可以在 unit B 的定义中用"require A"来表示。这样 systemd 就会保证先启动 A 再启动 B。

### 4. Systemd 的并发启动原理

&#160; &#160; &#160; &#160;如前所述，在 Systemd 中，所有的服务都并发启动，比如 Avahi、D-Bus、livirtd、X11、HAL 可以同时启动。乍一看，这似乎有点儿问题，比如 Avahi 需要 syslog 的服务，Avahi 和 syslog 同时启动，假设 Avahi 的启动比较快，所以 syslog 还没有准备好，可是 Avahi 又需要记录日志，这岂不是会出现问题？

&#160; &#160; &#160; &#160;Systemd 的开发人员仔细研究了服务之间相互依赖的本质问题，发现所谓依赖可以分为三个具体的类型，而每一个类型实际上都可以通过相应的技术解除依赖关系。

### 1). socket 依赖

&#160; &#160; &#160; &#160;绝大多数的服务依赖是套接字依赖。比如服务 A 通过一个套接字端口 S1 提供自己的服务，其他的服务如果需要服务 A，则需要连接 S1。因此如果服务 A 尚未启动，S1 就不存在，其他的服务就会得到启动错误。所以传统地，人们需要先启动服务 A，等待它进入就绪状态，再启动其他需要它的服务。Systemd 认为，只要我们预先把 S1 建立好，那么其他所有的服务就可以同时启动而无需等待服务 A 来创建 S1 了。如果服务 A 尚未启动，那么其他进程向 S1 发送的服务请求实际上会被 Linux 操作系统缓存，其他进程会在这个请求的地方等待。一旦服务 A 启动就绪，就可以立即处理缓存的请求，一切都开始正常运行。

&#160; &#160; &#160; &#160;那么服务如何使用由 init 进程创建的套接字呢？

&#160; &#160; &#160; &#160;Linux 操作系统有一个特性，当进程调用 fork 或者 exec 创建子进程之后，所有在父进程中被打开的文件句柄 (file descriptor) 都被子进程所继承。套接字也是一种文件句柄，进程 A 可以创建一个套接字，此后当进程 A 调用 exec 启动一个新的子进程时，只要确保该套接字的 close_on_exec 标志位被清空，那么新的子进程就可以继承这个套接字。子进程看到的套接字和父进程创建的套接字是同一个系统套接字，就仿佛这个套接字是子进程自己创建的一 样，没有任何区别。

&#160; &#160; &#160; &#160;这个特性以前被一个叫做 inetd 的系统服务所利用。Inetd 进程会负责监控一些常用套接字端口，比如 Telnet，当该端口有连接请求时，inetd 才启动 telnetd 进程，并把有连接的套接字传递给新的 telnetd 进程进行处理。这样，当系统没有 telnet 客户端连接时，就不需要启动 telnetd 进程。Inetd 可以代理很多的网络服务，这样就可以节约很多的系统负载和内存资源，只有当有真正的连接请求时才启动相应服务，并把套接字传递给相应的服务进程。

&#160; &#160; &#160; &#160;和 inetd 类似，systemd 是所有其他进程的父进程，它可以先建立所有需要的套接字，然后在调用 exec 的时候将该套接字传递给新的服务进程，而新进程直接使用该套接字进行服务即可。

### 2). D-Bus 依赖

&#160; &#160; &#160; &#160;D-Bus 是 desktop-bus 的简称，是一个低延迟、低开销、高可用性的进程间通信机制。它越来越多地用于应用程序之间通信，也用于应用程序和操作系统内核之间的通信。很多现代的服务 进程都使用D-Bus 取代套接字作为进程间通信机制，对外提供服务。比如简化 Linux 网络配置的 NetworkManager 服务就使用 D-Bus 和其他的应用程序或者服务进行交互：邮件客户端软件 evolution 可以通过 D-Bus 从 NetworkManager 服务获取网络状态的改变，以便做出相应的处理。

&#160; &#160; &#160; &#160;D-Bus 支持所谓"bus activation"功能。如果服务 A 需要使用服务 B 的 D-Bus 服务，而服务 B 并没有运行，则 D-Bus 可以在服务 A 请求服务 B 的 D-Bus 时自动启动服务 B。而服务 A 发出的请求会被 D-Bus 缓存，服务 A 会等待服务 B 启动就绪。利用这个特性，依赖 D-Bus 的服务就可以实现并行启动。

### 3).文件系统依赖

&#160; &#160; &#160; &#160;系统启动过程中，文件系统相关的活动是最耗时的，比如挂载文件系统，对文件系统进行磁盘检查（fsck），磁盘配额检查等都是非常耗时的操作。在等待这些工 作完成的同时，系统处于空闲状态。那些想使用文件系统的服务似乎必须等待文件系统初始化完成才可以启动。但是 systemd 发现这种依赖也是可以避免的.

&#160; &#160; &#160; &#160;Systemd 参考了 autofs 的设计思路，使得依赖文件系统的服务和文件系统本身初始化两者可以并发工作。autofs 可以监测到某个文件系统挂载点真正被访问到的时候才触发挂载操作，这是通过内核 automounter 模块的支持而实现的。比如一个 open()系统调用作用在"/misc/cd/file1"的时候，/misc/cd 尚未执行挂载操作，此时 open()调用被挂起等待，Linux 内核通知 autofs，autofs 执行挂载。这时候，控制权返回给 open()系统调用，并正常打开文件。

&#160; &#160; &#160; &#160;Systemd 集成了 autofs 的实现，对于系统中的挂载点，比如/home，当系统启动的时候，systemd 为其创建一个临时的自动挂载点。在这个时刻/home 真正的挂载设备尚未启动好，真正的挂载操作还没有执行，文件系统检测也还没有完成。可是那些依赖该目录的进程已经可以并发启动，他们的 open()操作被内建在 systemd 中的 autofs 捕获，将该 open()调用挂起（可中断睡眠状态）。然后等待真正的挂载操作完成，文件系统检测也完成后，systemd 将该自动挂载点替换为真正的挂载点，并让 open()调用返回。由此，实现了那些依赖于文件系统的服务和文件系统本身同时并发启动。

&#160; &#160; &#160; &#160;当然对于"/"根目录的依赖实际上一定还是要串行执行，因为 systemd 自己也存放在/之下，必须等待系统根目录挂载检查好。

&#160; &#160; &#160; &#160;不过对于类似/home 等挂载点，这种并发可以提高系统的启动速度，尤其是当/home 是远程的 NFS 节点，或者是加密盘等，需要耗费较长的时间才可以准备就绪的情况下，因为并发启动，这段时间内，系统并不是完全无事可做，而是可以利用这段空余时间做更多 的启动进程的事情.

### a) systemctl基本使用

输出激活的单元：

	$ systemctl

以下命令等效：

	$ systemctl list-units

输出运行失败的单元：

	$ systemctl --failed

所有可用的单元文件存放在 /usr/lib/systemd/system/ 和 /etc/systemd/system/ 目录（后者优先级更高）。查看所有已安装服务：

	$ systemctl list-unit-files

### b) 单元的基本使用

立即激活（启动或者开启）单元：

	# systemctl start <服务单元>

停止单元：

	# systemctl stop <服务单元>

重启单元：

    # systemctl restart <单元>

命令单元重新读取配置文件：

	# systemctl reload <单元>

输出单元运行状态：

	$ systemctl status <单元>

检查单元是否配置为自动启动：

	$ systemctl is-enabled <单元>

开启开机启动单元：

	# systemctl enable <单元>

注: 

&#160; &#160; &#160; &#160;如果服务没有[Install]段落，一般意味着应该通过其它服务自动调用它们。如果真的需要手动安装，可以直接连接服务，如下（将foo替换为真实的服务名）：

	# ln -s /usr/lib/systemd/system/foo.service /etc/systemd/system/graphical.target.wants/

取消开机启动单元：

	# systemctl disable <单元>

显示单元的手册页（必须由单元文件提供）：

	# systemctl help <单元>

重新载入 systemd，扫描新的或有变动的单元：

	# systemctl daemon-reload

### 单元文件
### 1. 编写服务单元文件
\.service单元文件示例

	# vim sshd.service 

	[Unit]
	Description=OpenSSH server daemon
	After=network.target sshd-keygen.service
	Wants=sshd-keygen.service

	[Service]
	EnvironmentFile=/etc/sysconfig/sshd
	ExecStart=/usr/sbin/sshd -D $OPTIONS
	ExecReload=/bin/kill -HUP $MAINPID
	KillMode=process
	Restart=on-failure
	RestartSec=42s

	[Install]
	WantedBy=multi-user.target

### a. 依赖关系[Unit]

&#160; &#160; &#160; &#160;使用systemd时，可通过正确编写单元配置文件来解决其依赖关系。典型的情况是，单元A要求单元B在A启动之前运行。在此情况下，向单元A配置文件中 的 [Unit] 段添加 Requires=B 和 After=B 即可。若此依赖关系是可选的，可添加 Wants=B 和 After=B。请注意 Wants= 和 Requires= 并不意味着 After=，即如果 After= 选项没有制定，这两个单元将被并行启动。

&#160; &#160; &#160; &#160;依赖关系通常被用在服务（service）而不是目标（target）上。例如， network.target 一般会被某个配置网络接口的服务引入，所以，将自定义的单元排在该服务之后即可，因为 network.target 已经启动。

### b.启动方式[Service]

&#160; &#160; &#160; &#160;编写自定义的service文件时，可以选择几种不同的服务启动方式。启动方式可通过配置文件 [Service] 段中的 Type= 参数进行设置。具体的参数说明请参阅 man systemd.service 。

+ Type=simple（默认值）：systemd认为该服务将立即启动。服务进程不会fork。如果该服务要启动其他服务，不要使用此类型启动，除非该服务是socket激活型。
+ Type=forking：systemd 认为当该服务进程fork，且父进程退出后服务启动成功。对于常规的守护进程（daemon），除非你确定此启 动方式无法满足需求，使用此类型启动即可。使用此启动类型应同时指定 PIDFile=，以便systemd能够跟踪服务的主进程。
+ Type=oneshot：这一选项适用于只执行一项任务、随后立即退出的服务。可能需要同时设置 RemainAfterExit=yes 使得 systemd 在服务进程退出之后仍然认为服务处于激活状态。
+ Type=notify：与 Type=simple 相同，但约定服务会在就绪后向 systemd 发送一个信号。这一通知的实现由 libsystemd-daemon.so 提供。
+ Type=dbus：若以此方式启动，当指定的 BusName 出现在DBus系统总线上时，systemd认为服务就绪。

### c. 服务目标[Install]

+ Alias为单元提供一个空间分离的附加名字。
+ RequiredBy单元被允许运行需要的一系列依赖单元，RequiredBy列表从Require获得依赖信息。
+ WantBy单元被允许运行需要的弱依赖性单元，Wantby从Want列表获得依赖信息。
+ Also指出和单元一起安装或者被协助的单元。
+ DefaultInstance实例单元的限制，这个选项指定如果单元被允许运行默认的实例。

### 2.修改现存单元文件

&#160; &#160; &#160; &#160;要更改由软件包提供的单元文件，先创建名为 /etc/systemd/system/<单元名>.d/ 的目录（如 /etc/systemd/system/httpd.service.d/），然后放入 *.conf 文件，其中可以添加或重置参数。这里设置的参数优先级高于原来的单元文件。

&#160; &#160; &#160; &#160;例如，如果想添加一个额外的依赖，创建这么一个文件即可：

	# vim /etc/systemd/system/<unit>.d/customdependency.conf
	[Unit] 
	Requires=<新依赖> 
	After=<新依赖>

然后运行以下命令使更改生效：

	# systemctl daemon-reload
	# systemctl restart <单元>

&#160; &#160; &#160; &#160;此外，把旧的单元文件从 /usr/lib/systemd/system/ 复制到 /etc/systemd/system/，然后进行修改，也可以达到同样效果。在 /etc/systemd/system/ 目录中的单元文件的优先级总是高于 /usr/lib/systemd/system/ 目录中的同名单元文件。注意，当 /usr/lib/ 中的单元文件因软件包升级变更时，/etc/ 中自定义的单元文件不会同步更新。此外，你还得执行 systemctl reenable <unit>，手动重新启用该单元。因此，建议使用前面一种利用 *.conf 的方法。
注:

1. 可以用 systemd-delta 命令来查看哪些单元文件被覆盖、哪些被修改。
1. 可从官方仓库安装 vim-systemd 软件包，使 unit 配置文件在 Vim 下支持语法高亮。

### 目标（target）
### 1. 简介

&#160; &#160; &#160; &#160;启动级别（runlevel）是一个旧的概念。现在，systemd 引入了一个和启动级别功能相似又不同的概念——目标（target）。不像数字表示的启动级别，每个目标（target）都有名字和独特的功能，并且能同 时启用多个。一些 目标（target）继承其他目标（target）的服务，并启动新服务。systemd 提供了一些模仿 sysvinit 启动级别的目标（target），也可以使用旧的 telinit 启动级别 命令切换。

&#160; &#160; &#160; &#160;获取当前目标（target），当然runlevel依然可用：

	$ systemctl list-units --type=target

### 2.创建新目标（target）

&#160; &#160; &#160; &#160;在Fedora 中，启动级别 0、1、3、5、6 都被赋予特定用途，并且都对应一个 systemd 的目标（target）。然而，没有什么很好的移植用户定义的启动级别（2、4）的方法。要实现类似功能，可以以原有的启动级别为基础，

1.创建一个新的 目标（target）{ /etc/systemd/system/<新目标（.target文件）>}（可以参考 /usr/lib/systemd/system/graphical.target）

2.创建 {/etc/systemd/system/<新目标>.wants 目录}，并向其中加入额外服务的链接并指向 /usr/lib/systemd/system/ 中的单元文件。

目标表：

{{< pure_table

"SysV启动级别|Systemd目标|注释"
"0|runlevel0.target, poweroff.target|中断系统（halt）"
"1, s, single|runlevel1.target, rescue.target|单用户模式"
"2, 4|runlevel2.target, runlevel4.target, multi-user.target|用户自定义启动级别，通常识别为级别3。"
"3|runlevel3.target, multi-user.target|多用户，无图形界面。用户可以通过终端或网络登录。"
"5|runlevel5.target, graphical.target|多用户，图形界面。继承级别3的服务，并启动图形界面服务。"
"6|runlevel6.target, reboot.target|重启"
"emergency|	emergency.target|急救模式（Emergency shell）"

>}}

### 3.切换启动级别/目标（target）

&#160; &#160; &#160; &#160;systemd 中，启动级别通过“目标单元（.target文件）”访问。

&#160; &#160; &#160; &#160;可以通过如下命令切换：

&#160; &#160; &#160; &#160;该命令对下次启动无影响，也就是重启后失效。等价于telinit 3 或 telinit 5。

	# systemctl isolate graphical.target

### 4.修改默认启动级别/目标（target）

开机启动进的目标（target）是 default.target，默认链接到 graphical.target （大致相当于原来的启动级别5）。可以通过内核参数更改默认启动级别：

+  systemd.unit=multi-user.target （大致相当于级别3）
+  systemd.unit=rescue.target （大致相当于级别1）

另一个方法是修改 default.target。可以通过 systemctl 修改它：

    # systemctl enable multi-user.target

&#160; &#160; &#160; &#160;相当于ln -s /lib/systemd/system/multi-user.target /etc/systemd/system/default.target
命令执行情况由 systemctl 显示：ln -s /etc/systemd/system/default.target 被创建，指向新的默认启动级别。该方法当且仅当目标配置文件中有以下内容时有效：

	[Install]
	Alias=default.target

目前，multi-user.target、graphical.target 都包含这段内容。

注：

1.查看默认级别

    # ll /etc/systemd/system/default.target

### 日志
### 1. 说明

&#160; &#160; &#160; &#160;systemd提供了自己日志系统（logging system），称为 journal. 使用 systemd 日志，无需额外安装日志服务（syslog）。读取日志的命令：

	# journalctl

&#160; &#160; &#160; &#160;默认情况下（当 Storage= 在文件 /etc/systemd/journald.conf 中被设置为 auto），日志记录将被写入 /var/log/journal/。该目录是 systemd 软件包的一部分。若被删除，systemd 不会自动创建它，直到下次升级软件包时重建该目录。如果该目录缺失，systemd 会将日志记录写入 /run/systemd/journal。这意味着，系统重启后日志将丢失。

### 2. 过滤输出

&#160; &#160; &#160; &#160;journalctl可以根据特定字段过滤输出，

&#160; &#160; &#160; &#160;例如：显示本次启动后的所有日志：

	# journalctl -b

&#160; &#160; &#160; &#160;不过，一般大家更关心的不是本次启动后的日志，而是上次启动时的（例如，刚刚系统崩溃了）。目前还没有这项功能，正在 systemd-devel@lists.freedesktop.org 讨论中。目前的折中方案是：

	# journalctl --since=today | tac | sed -n '/-- Reboot --/{n;:r;/-- Reboot --/q;p;n;b r}' | tac

&#160; &#160; &#160; &#160;以上命令输出本日内的所有启动信息。但要注意，如果日志很多，该命令执行时间会比较漫长。动态跟踪最新信息：

	# journalctl -f

显示特定程序的所有消息:

	# journalctl /usr/lib/systemd/systemd

显示特定进程的所有消息:

	# journalctl _PID=1

显示指定单元的所有消息：

	# journalctl -u netcfg

详情参阅man journalctl、man systemd.journal-fields

### 3. 日志大小限制

&#160; &#160; &#160; &#160;如果按上面的操作保留日志的话，默认日志最大限制为所在文件系统容量的 10%，即：如果 /var/log/journal 储存在 50GiB 的根分区中，那么日志最多存储 5GiB 数据。可以修改 /etc/systemd/journald.conf 中的 SystemMaxUse 来指定该最大限制。如限制日志最大 50MiB：

	SystemMaxUse=50M

详情参见 man journald.conf.

### 4. 配合syslog使用

&#160; &#160; &#160; &#160;systemd 提供了 socket /run/systemd/journal/syslog，以兼容传统日志服务。所有系统信息都会被传入。要使传统日志服务工作，需要让服务链接该 socket，而非 /dev/log（官方说明）。Arch 软件仓库中的 syslog-ng 已经包含了需要的配置。

&#160; &#160; &#160; &#160;设置开机启动 syslog-ng：

	# systemctl enable syslog-ng


## 结束
### 问题
### 1.关机/重启十分缓慢

&#160; &#160; &#160; &#160;如果关机特别慢（甚至跟死机了一样），很可能是某个拒不退出的服务在作怪。systemd 会等待一段时间，然后再尝试杀死它。

### 2.短时进程无日志记录

&#160; &#160; &#160; &#160;若 journalctl -u foounit.service 没有显示某个短时进程的任何输出，那么改用 PID 试试。例如，若 systemd-modules-load.service 执行失败，那么先用 systemctl status systemd-modules-load 查询其 PID（比如是123），然后检索该 PID 相关的日志 journalctl -b _PID=123。运行时进程的日志元数据（诸如 _SYSTEMD_UNIT 和 _COMM）被乱序收集在 /proc 目录。要修复该问题，必须修改内核，使其通过套接字连接来提供上述数据，该过程类似于 SCM_CREDENTIALS。

### 3.诊断启动问题

&#160; &#160; &#160; &#160;使用如下内核参数引导： 

	systemd.log_level=debug systemd.log_target=kmsg log_buf_len=1M

### 4.禁止在程序崩溃时转储内存

要使用老的内核转储，创建下面文件:

	/etc/sysctl.d/49-coredump.conf

	kernel.core_pattern = core
	kernel.core_uses_pid = 0

然后运行：

	# /usr/lib/systemd/systemd-sysctl

同样可能需要执行“unlimit”设置文件大小：

	$ ulimit -c unlimited


---
## 结束

本文引自：

1> https://blog.linuxeye.com/400.html

2> http://www.ibm.com/developerworks/cn/linux/1407_liuming_init3/index.html



