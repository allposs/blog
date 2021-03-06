---
title:          101-容器技术与Docker
date:           2019-04-12T14:20:23+08:00
draft:          true
tags:           [2019-04]
topics:         [Docker]
---

## 简介

&nbsp;&nbsp;&nbsp;&nbsp;Docker是现今比较火热的一个开源软件，遵从了Apache2.0协议，使用Go语言开发,基于容器技术实现的一种系统层的虚拟化软件。

&nbsp;&nbsp;&nbsp;&nbsp;容器技术是管理使用容器的一种技术，而容器是将软件打包成标准化单元，以用于开发、交付和部署的一种标准单元。
<!--more-->

## 环境

无

## 软件包

五

## 拓扑图

无


## 正文
---
### 一、什么是 Docker ？

&nbsp;&nbsp;&nbsp;&nbsp;Docker 是一个开源项目，诞生于2013年初，最初是dotCloud公司内部的一个业余项目。它基于Google公司推出的Go语言实现。 项目后来加入了Linux基金会，遵从了Apache2.0协议，项目代码在GitHub上进行维护。Docker 自开源后受到广泛的关注和讨论，以至于dotCloud公司后来都改名为Docker Inc。Redhat已经在其RHEL6.5及后续版本支持Docker；Google也在其PaaS产品中广泛应用.

&nbsp;&nbsp;&nbsp;&nbsp;Docker 项目使用Google公司推出的Go语言进行开发实现，基于 Linux 内核 的cgroup，namespace，以及AUFS类的UnionFS等技术，对进程进行封装隔离，属于操作系统层面的虚拟化技术。由于隔离的进程独立于宿主和其它的隔离的进程，因此也称其为容器。Docke最初实现是基于 LXC.简单点说就是在 容器技术的基础上Docker进行了进一步的封装，让用户不需要去关心容器的管理，使得操作更为简便。用户操作Docker的容器就像操作一个快速轻量级的虚拟机一样简单。

&nbsp;&nbsp;&nbsp;&nbsp;下面的图片比较了 Docker 和传统虚拟化方式的不同之处，可见容器是在操作系统层面上实现虚拟化，直接复用本地主机的操作系统，而传统方式则是在硬件层面实现。

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/001/virtualization.png"
>}}

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/001/docker.png"
>}}



### 二、Docker与容器

&nbsp;&nbsp;&nbsp;&nbsp;当前，docker几乎是容器的代名词，很多人以为docker就是容器。其实，这是错误的认识，除了docker还有coreos。所以，容器世界里并不是只有docker一家。既然不是一家就很容易出现分歧。任何技术出现都需要一个标准来规范它，不然各搞各的很容易导致技术实现的碎片化，出现大量的冲突和冗余。因此，在2015年，由Google，Docker、CoreOS、IBM、微软、红帽等厂商联合发起的OCI（Open Container Initiative）组织成立了，并于2016年4月推出了第一个开放容器标准。标准主要包括runtime运行时标准和image镜像标准。标准的推出，有助于替成长中市场带来稳定性，让企业能放心采用容器技术，用户在打包、部署应用程序后，可以自由选择不同的容器Runtime；同时，镜像打包、建立、认证、部署、命名也都能按照统一的规范来做。那么什么是容器？

**OCI** https://www.opencontainers.org/ 

### 三、什么是容器？

**官方解释**：

&nbsp;&nbsp;&nbsp;&nbsp;容器就是将软件打包成标准化单元，以用于开发、交付和部署。

&nbsp;&nbsp;&nbsp;&nbsp;容器这个词，当你第一眼看它或许脑子里是这东西：瓶瓶罐罐、装水、装东西的物品。不管是什么，总的来说，容器给人第一印象就是——"装"。

&nbsp;&nbsp;&nbsp;&nbsp;那今天我们要说的容器技术是怎么一个概念呢？其实，IT里的容器技术是英文单词Linux Container的直译。container这个单词有集装箱、容器的含义（主要偏集装箱意思）。不过，在中文环境下，咱们要交流要传授，如果翻译成“集装箱技术” 就有点拗口，所以结合中国人的吐字习惯和文化背景，更喜欢用容器这个词。不过，如果要形象的理解Linux Container技术的话，还是得念成集装箱会比较好。我们知道，海边码头里的集装箱是运载货物用的，它是一种按规格标准化的钢制箱子。集装箱的特色，在于其格式划一，并可以层层重叠，所以可以大量放置在特别设计的远洋轮船中（早期航运是没有集装箱概念的，那时候货物杂乱无章的放，很影响出货和运输效率）。有了集装箱，那么这就更加快捷方便的为生产商提供廉价的运输服务。

&nbsp;&nbsp;&nbsp;&nbsp;因此，IT世界里借鉴了这一理念。早期，大家都认为硬件抽象层基于hypervisor的虚拟化方式可以最大程度上提供虚拟化管理的灵活性。各种不同操作系统的虚拟机都能通过hypervisor（KVM、XEN等）来衍生、运行、销毁。然而，随着时间推移，用户发现hypervisor这种方式麻烦越来越多。为什么？因为对于hypervisor环境来说，每个虚拟机都需要运行一个完整的操作系统以及其中安装好的大量应用程序。但实际生产开发环境里，我们更关注的是自己部署的应用程序，如果每次部署发布我都得搞一个完整操作系统和附带的依赖环境，那么这让任务和性能变得很重和很低下。

&nbsp;&nbsp;&nbsp;&nbsp;基于上述情况，人们就在想，有没有其他什么方式能让人更加的关注应用程序本身，底层多余的操作系统和环境我可以共享和复用？换句话来说，那就是我部署一个服务运行好后，我再想移植到另外一个地方，我可以不用再安装一套操作系统和依赖环境。这就像集装箱运载一样，我把货物一辆兰博基尼跑车（好比开发好的应用APP），打包放到一容器集装箱里，它通过货轮可以轻而易举的从上海码头（CentOS7.2环境）运送到纽约码头（windows环境）。而且运输期间，我的兰博基尼（APP）没有受到任何的损坏（文件没有丢失），在另外一个码头卸货后，依然可以完美风骚的赛跑（启动正常）。

&nbsp;&nbsp;&nbsp;&nbsp;Linux Container容器技术的诞生（2008年）就解决了IT世界里“集装箱运输”的问题。Linux Container（简称LXC）它是一种内核轻量级的操作系统层虚拟化技术。Linux Container主要由Namespace和Cgroup两大机制来保证实现。那么Namespace和Cgroup是什么呢？刚才我们上面提到了集装箱，集装箱的作用当然是可以对货物进行打包隔离了，不让A公司的货跟B公司的货混在一起，不然卸货就分不清楚了。那么Namespace也是一样的作用，做隔离。光有隔离还没用，我们还需要对货物进行资源的管理。同样的，航运码头也有这样的管理机制：货物用什么样规格大小的集装箱，货物用多少个集装箱，货物哪些优先运走，遇到极端天气怎么暂停运输服务怎么改航道等等... 通用的，与此对应的Cgroup就负责资源管理控制作用，比如进程组使用CPU/MEM的限制，进程组的优先级控制，进程组的挂起和恢复等等。

### 四、容器技术的特点

&nbsp;&nbsp;&nbsp;&nbsp;容器的特点其实我们拿跟它跟硬件抽象层虚拟化hypervisor技术对比就清楚了，我们之前也提到过，传统的虚拟化（虚拟机）技术，创建环境和部署应用都很麻烦，而且应用的移植性也很繁琐，比如你要把vmware里的虚拟机迁移到KVM里就很繁琐（需要做镜像格式的转换）。那么有了容器技术就简单了，总结下容器技术主要有三个特点：

* a). 容器镜像是轻量的、可执行的独立软件包 ，包含软件运行所需的所有内容：代码、运行时环境、系统工具、系统库和设置。

* b). 容器化软件适用于基于Linux和Windows的应用，在任何环境中都能够始终如一地运行。

* c). 容器赋予了软件独立性 ，使其免受外在环境差异（例如，开发和预演环境的差异）的影响，从而有助于减少团队间在相同基础设施上运行不同软件时的冲突。


### 五、容器技术的标准

两种标准主要包含以下内容：

容器运行时标准 （runtime spec）

网址： https://github.com/opencontainers/runtime-spec

* a). creating：使用create命令创建容器，这个过程称为创建中 

* b). created：容器创建出来，但是还没有运行，表示镜像和配置没有错误，容器能够运行在当前平台 

* c). running：容器的运行状态，里面的进程处于up状态，正在执行用户设定的任务 

* d). stopped：容器运行完成，或者运行出错，或者stop命令之后，容器处于暂停状态。这个状态，容器还有很多信息保存在平台中，并没有完全被删除

容器镜像标准（image spec）:

网址： https://github.com/opencontainers/image-spec

* a). 文件系统：以layer保存的文件系统，每个layer（层级）保存了和上层之间变化的部分，layer 应该保存哪些文件，怎么表示增加、修改和删除的文件等; 

* b). config文件：保存了文件系统的层级信息（每个层级的hash值，以及历史信息），以及容器运行时需要的一些信息（比如环境变量、工作目录、命令参数、mount列表），指定了镜像在某个特定平台和系统的配置。比较接近我们使用 docker inspect <image_id> 看到的内容; 

* c). manifest文件：镜像的config文件索引，有哪些layer，额外的annotation信息，manifest 文件中保存了很多和当前平台有关的信息; 

* d). index 文件：可选的文件，指向不同平台的manifest文件，这个文件能保证一个镜像可以跨平台使用，每个平台拥有不同的manifest文件，使用index作为索引。

### 六、容器的主要应用场景

&nbsp;&nbsp;&nbsp;&nbsp;容器技术的诞生其实主要解决了PAAS的层的技术实现。像OpenStack、Cloudstack这样的技术是解决IAAS层的问题。IaaS PaaS SaaS其实是云计算的分层。

* IaaS: Infrastructure-as-a-Service（基础设施即服务）

* PaaS: Platform-as-a-Service（平台即服务）

* SaaS: Software-as-a-Service（软件即服务）

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/001/Cloud.jpg"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;第一层 IaaS: 有时候也叫做Hardware-as-a-Service，几年前如果你想在办公室或者公司的网站上运行一些企业应用，你需要去买服务器，或者别的高昂的硬件来控制本地应用，让你的业务运行起来。
&nbsp;&nbsp;&nbsp;&nbsp;但是现在有IaaS，你可以将硬件外包到别的地方去。IaaS公司会提供场外服务器，存储和网络硬件，你可以租用。节省了维护成本和办公场地，公司可以在任何时候利用这些硬件来运行其应用。
&nbsp;&nbsp;&nbsp;&nbsp;一些大的IaaS公司包括Amazon, Microsoft, VMWare, Rackspace和Red Hat.不过这些公司又都有自己的专长，比如Amazon和微软给你提供的不只是IaaS，他们还会将其计算能力出租给你来host你的网站。

&nbsp;&nbsp;&nbsp;&nbsp;第二层 PaaS: 某些时候也叫做中间件。你公司所有的开发都可以在这一层进行，节省了时间和资源。

&nbsp;&nbsp;&nbsp;&nbsp;PaaS公司在网上提供各种开发和分发应用的解决方案，比如虚拟服务器和操作系统。这节省了你在硬件上的费用，也让分散的工作室之间的合作变得更加容易。网页应用管理，应用设计，应用虚拟主机，存储，安全以及应用开发协作工具等。

&nbsp;&nbsp;&nbsp;&nbsp;一些大的PaaS提供者有Google App Engine,Microsoft Azure，Force.com,Heroku，Engine Yard。最近兴起的公司有AppFog, Mendix 和 Standing Cloud

&nbsp;&nbsp;&nbsp;&nbsp;第三层 SaaS: 这一层是和你的生活每天接触的一层，大多是通过网页浏览器来接入。任何一个远程服务器上的应用都可以通过网络来运行，就是SaaS了。

&nbsp;&nbsp;&nbsp;&nbsp;你消费的服务完全是从网页如Netflix, MOG, Google Apps, Box.net, Dropbox或者苹果的iCloud那里进入这些分类。尽管这些网页服务是用作商务和娱乐或者两者都有，但这也算是云技术的一部分。

&nbsp;&nbsp;&nbsp;&nbsp;一些用作商务的SaaS应用包括Citrix的GoToMeeting，Cisco的WebEx，Salesforce的CRM，ADP，Workday和SuccessFactors。


那么容器技术主要应用在哪些场景呢？目前主流的有以下几种：

>1. 容器化传统应用 容器不仅能提高现有应用的安全性和可移植性，还能节约成本。每个企业的环境中都有一套较旧的应用来服务于客户或自动执行业务流程。即使是大规模的单体应用，通过容器隔离的增强安全性、以及可移植性特点，也能从 Docker 中获益，从而降低成本。一旦容器化之后，这些应用可以扩展额外的服务或者转变到微服务架构之上。

>2. 持续集成和持续部署 (CI/CD) 通过 Docker 加速应用管道自动化和应用部署，交付速度提高至少 13 倍。现代化开发流程快速、持续且具备自动执行能力，最终目标是开发出更加可靠的软件。通过持续集成 (CI) 和持续部署 (CD)，每次开发人员签入代码并顺利测试之后，IT 团队都能够集成新代码。作为开发运维方法的基础，CI/CD 创造了一种实时反馈回路机制，持续地传输小型迭代更改，从而加速更改，提高质量。CI 环境通常是完全自动化的，通过 git 推送命令触发测试，测试成功时自动构建新镜像，然后推送到 Docker 镜像库。通过后续的自动化和脚本，可以将新镜像的容器部署到预演环境，从而进行进一步测试。

>3. 微服务 加速应用架构现代化进程。应用架构正在从采用瀑布模型开发法的单体代码库转变为独立开发和部署的松耦合服务。成千上万个这样的服务相互连接就形成了应用。Docker 允许开发人员选择最适合于每种服务的工具或技术栈，隔离服务以消除任何潜在的冲突，从而避免“地狱式的矩阵依赖”。这些容器可以独立于应用的其他服务组件，轻松地共享、部署、更新和瞬间扩展。Docker 的端到端安全功能让团队能够构建和运行最低权限的微服务模型，服务所需的资源（其他应用、涉密信息、计算资源等）会适时被创建并被访问。

>4. IT 基础设施优化 充分利用基础设施，节省资金。Docker 和容器有助于优化 IT 基础设施的利用率和成本。优化不仅仅是指削减成本，还能确保在适当的时间有效地使用适当的资源。容器是一种轻量级的打包和隔离应用工作负载的方法，所以 Docker 允许在同一物理或虚拟服务器上毫不冲突地运行多项工作负载。企业可以整合数据中心，将并购而来的IT资源进行整合，从而获得向云端的可迁移性，同时减少操作系统和服务器的维护工作。

### 七、Docker版本

&nbsp;&nbsp;&nbsp;&nbsp;Docker从2013年开源. 2015年是 Docker 开源项目突飞猛进的一年，这段时间Docker官方先后发布了V1.5、V1.6、V1.7、V1.8、V1.9等5个大版本以及7个修订版本

&nbsp;&nbsp;&nbsp;&nbsp;2016年 Docker发展同样迅速，截止2016年12月7日Docker官方共发布了V1.10, V1.11, V1.12等3个大版本以及8个修订版本.

&nbsp;&nbsp;&nbsp;&nbsp;2017年1月18日, Docker 发布了最重大的一次版本更新 V1.13, 2月8日发布了V1.13.1, 在3月1日, Docker 公布了新的命名规则，V1.13.1版本之后, 所有的版本都会按照 VYY.MM 的格式进行打包. 比如 Docker 在2017年3月的这次更新, 新的版本号变成了 V17.03.0-ce，前面是日期不用解释, 后面的CE暴露了 Docker 公司渴望将该容器技术商业化的决心. 从此之后 Docker 的版本划分为商业版本的 EE和开源社区版本的 CE , 其中开源社区版本也分成了两类, 分别为 每季度更新的Stable稳定版和每月更新的Edge 开发版

Docker EE提供三个服务层次：

{{< pure_table
"服务层级|功能"
"Basic  |包含用于认证基础设施的Docker平台;Docker公司的支持;经过 认证的、来自Docker Store的容器与插件"
"Standard|添加高级镜像与容器管理;LDAP/AD用户集成;基于角色的访问控制(Docker Datacenter)"
"Advanced|添加Docker安全扫描;连续漏洞监控"
>}}


Docker CE分为stable和edge两种发布方式:

> stable版本是季度发布方式，比如17.03, 17.06, 17.09，适用于希望更加容易维护的用户（稳定版）。

> edge版本是月份发布方式， 比如17.03, 17.04……，主要面向那些喜欢尝试新功能的用户。

关于docker在windows系统：

&nbsp;&nbsp;&nbsp;&nbsp;windows10版本以前，widnows下docker实现方式是让Docker引擎使用了一个定制的Linux内核，所以要在Windows下运行Docker我们需要用到一个轻量级的虚拟机(vm)，我们使用Windows Docker客户端以控制Docker引擎，来创建，运行和管理我们的Docker容器（关于Docker引擎，容器等具体概念请参考官网）。

### 八、Docker安装

1、Ubuntu系统

&nbsp;&nbsp;&nbsp;&nbsp;Docker 要求Ubuntu系统的内核版本高于3.10,通过uname -r命令查看你当前的内核版本.

    $ wget -qO- https://get.docker.com/ | sh
    $ sudo service docker start

2、CentOS系统

&nbsp;&nbsp;&nbsp;&nbsp;Docker 运行在 CentOS 7 上，要求系统为64位、系统内核版本为 3.10 以上。（推荐）

&nbsp;&nbsp;&nbsp;&nbsp;Docker 运行在 CentOS-6.5 或更高的版本的 CentOS 上，要求系统为64位、系统内核版本为 2.6.32-431 或者更高版本。(不推荐)

CentOS 7:

    安装最新版本：

    $ yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
    $ yum install -y yum-utils \
                        device-mapper-persistent-data \
                        lvm2
    $ yum-config-manager \
                         --add-repo \
                        https://download.docker.com/linux/centos/docker-ce.repo
    $ yum list docker-ce --showduplicates | sort -r
    $ yum install docker-ce-<VERSION_STRING> docker-ce-cli-<VERSION_STRING> containerd.io
    $ systemctl enable docker && systemctl start docker

安装稳定发行版：

    $ yum install docker docker-compose -y
    $ systemctl enable docker && systemctl start docker


3、Windows系统

&nbsp;&nbsp;&nbsp;&nbsp;64位Windows 10 Pro、Enterprise或者Education版本（Build 10586以上版本，需要安装1511 November更新）

&nbsp;&nbsp;&nbsp;&nbsp;在系统中启用Hyper-V。如果没有启用，Docker for Windows在安装过程中会自动启用Hyper-V（这个过程需要重启系统）
不过，如果不是使用的Windows 10，也没有关系，可以使用Docker Toolbox作为替代方案。

下载地址：

> https://download.docker.com/win/stable/Docker%20for%20Windows%20Installer.exe

4、Mac OS X系统

&nbsp;&nbsp;&nbsp;&nbsp;如果需要手动下载，请点击以下链接下载Stable或Edge版本的Docker for Mac。(注意OS X并没有使用linux原生内核，所以MAC对Docker的支持也只是虚拟模式)

> Stable: https://download.docker.com/mac/stable/Docker.dmg

> Edge: https://download.docker.com/mac/edge/Docker.dmg

&nbsp;&nbsp;&nbsp;&nbsp;如同 macOS 其它软件一样，安装也非常简单，双击下载的 .dmg 文件，然后将鲸鱼图标拖拽到 Application 文件夹即可。

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/001/docker_mac_000.png"
>}}

&nbsp;&nbsp;&nbsp;&nbsp;从应用中找到 Docker 图标并点击运行。可能会询问 macOS 的登陆密码，输入即可。

{{< fluid_imgs
    " pure-u-1-1|/post/images/kubernetes/001/docker_mac_001.png"
>}}

---
## 结束