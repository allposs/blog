---
title:          003-CFSSL制作证书
date:           2020-01-08T10:20:23+08:00
draft:          true
tags:           [2020-01]
topics:         [SSL/TLS,安全]
---


## 简介

&nbsp;&nbsp;&nbsp;&nbsp;在工作中，我们经常会遇到各种证书问题，如k8s,etcd,openstack等服务时，我们往往都要使用证书，本文将使用CFSSL工具快速简单的配置证书。这里将生成三种证书包含客户端证书，服务端证书，双向证书。
client certificate： 用于服务端认证客户端,例如etcdctl、etcd proxy、fleetctl、docker客户端
server certificate: 服务端使用，客户端以此验证服务端身份,例如docker服务端、kube-apiserver
peer certificate:   双向证书，用于etcd集群成员间通信
<!--more-->

## 环境

无

## 软件包

无

## 拓扑图

无


## 正文
---



### 1.CFSSL安装及基础知识　
　　项目地址： https://github.com/cloudflare/cfssl

　　下载地址： https://pkg.cfssl.org/

　　CFSSL是CloudFlare开源的一款PKI/TLS工具。 CFSSL 包含一个命令行工具 和一个用于 签名，验证并且捆绑TLS证书的 HTTP API 服务。 使用Go语言编写。


### 2.安装cfssl

    export CFSSL_URL="https://pkg.cfssl.org/R1.2"
    wget "${CFSSL_URL}/cfssl_linux-amd64" -O /usr/bin/cfssl
    wget "${CFSSL_URL}/cfssljson_linux-amd64" -O /usr/bin/cfssljson
    wget "${CFSSL_URL}/cfssl-certinfo_linux-amd64" -O /usr/bin/cfssl-certinfo
    chmod +x /usr/bin/cfssl /usr/bin/cfssljson /usr/bin/cfssl-certinfo && mkdir -p /etc/etcd/ssl && cd /etc/etcd/ssl


### 3.cfssl常用命令：

    ## 初始化ca
    cfssl gencert -initca ca-csr.json | cfssljson -bare ca 
    ## 使用现有私钥, 重新生成
    cfssl gencert -initca -ca-key key.pem ca-csr.json | cfssljson -bare ca

    cfssl certinfo -cert ca.pem

    cfssl certinfo -csr ca.csr

### 4.创建CA证书

#### 1).输出默认证书配置模板

    cfssl print-defaults config > ca-config.json
    cat ca-config.json
    {
        "signing": {
            "default": {
                "expiry": "168h"
            },
            "profiles": {
                "www": {
                    "expiry": "8760h",
                    "usages": [
                        "signing",
                        "key encipherment",
                        "server auth"
                    ]
                },
                "client": {
                    "expiry": "8760h",
                    "usages": [
                        "signing",
                        "key encipherment",
                        "client auth"
                    ]
                }
            }
        }
    }

#### 2).修改证书配置模板

分别配置针对三种不同证书类型的profile,其中有效期43800h为5年

    cat <<EOF > ca-config.json
    {
        "signing": {
            "default": {
                "expiry": "43800h"
            },
            "profiles": {
                "server": {
                    "expiry": "43800h",
                    "usages": [
                        "signing",
                        "key encipherment",
                        "server auth"
                    ]
                },
                "client": {
                    "expiry": "43800h",
                    "usages": [
                        "signing",
                        "key encipherment",
                        "client auth"
                    ]
                },
                "peer": {
                    "expiry": "43800h",
                    "usages": [
                        "signing",
                        "key encipherment",
                        "server auth",
                        "client auth"
                    ]
                }
            }
        }
    }
    EOF

知识点：

+ ca-config.json：可以定义多个 profiles，如server,client,peer，分别定义不同的过期时间、使用场景等参数；后续在签名证书时使用某个 profile。
+ default默认策略，指定了证书的默认有效期是5年(43800h)
+ signing：表示该证书可用于签名其它证书；生成的 ca.pem 证书中 CA=TRUE；
+ server auth：表示client可以用该CA对server提供的证书进行验证；
+ client auth：表示server可以用该CA对client提供的证书进行验证；
+ expiry：也表示过期时间，如果不写以default中的为准;
+ 注意标点符号,标点符号只支持英文，最后一个字段一般是没有逗号（,）的;


#### 3).输出默认csr请求模板

    cfssl print-defaults csr > ca-csr.json 
    cat ca-csr.json
    {
        "CN": "example.net",
        "hosts": [
            "example.net",
            "www.example.net"
        ],
        "key": {
            "algo": "ecdsa",
            "size": 256
        },
        "names": [
            {
                "C": "US",
                "L": "CA",
                "ST": "San Francisco"
            }
        ]
    }

#### 4).修改csr请求模板

    cat <<EOF > ca-csr.json
    {
        "CN": "Self Signed CA",
        "key": {
            "algo": "rsa",
            "size": 2048
        },
        "names": [
            {
                "C": "CN",
                "L": "SH",
                "O": "Netease",
                "ST": "SH",            
                "OU": "OT"
            }    ]
    }
    EOF

知识点：
+ "key"：生成证书的算法
+ "CN"：Common Name，kube-apiserver 从证书中提取该字段作为请求的用户名 (User Name),注意浏览器使用该字段验证网站是否合法，一般写的是域名。非常重要。浏览器使用该字段验证网站是否合法
+ names：一些其它的属性
+ "C": Country， 国家
+ "L": Locality，地区，城市
+ "O": Organization Name，组织名称，公司名称(在k8s中常用于指定Group，进行RBAC绑定)
+ "OU"": Organization Unit Name，组织单位名称，公司部门
+ "ST": State，州，省

#### 4).生成CA证书和私钥
该命令会生成运行CA所必需的文件ca-key.pem（私钥）和ca.pem（证书），还会生成ca.csr（证书签名请求），用于交叉签名或重新签名。

    cfssl gencert -initca ca-csr.json | cfssljson -bare ca -

#### 5).其他

如果CA证书过期，则可以使用下面方法重新生成CA证书

    # 使用现有的CA私钥，重新生成： 
    cfssl gencert -initca -ca-key ca-key.pem ca-csr.json | cfssljson -bare ca
    # 使用现有的CA私钥和CA证书，重新生成：
    cfssl gencert -renewca -ca-key ca-key.pem -ca ca.pem  | cfssljson -bare ca

### 5. 签发Server证书

#### 1).打印csr模版

    cfssl print-defaults csr > server-csr.json
    cat server-csr.json
        {
            "CN": "example.net",
            "hosts": [
                "example.net",
                "www.example.net"
            ],
            "key": {
                "algo": "ecdsa",
                "size": 256
            },
            "names": [
                {
                    "C": "US",
                    "L": "CA",
                    "ST": "San Francisco"
                }
            ]
        }

#### 2).修改csr请求模板

    cat <<EOF > server-csr.json
    {
        "CN": "Server",
        "hosts": [
            "127.0.0.1","172.20.0.201","172.20.0.202","172.20.0.203","172.20.0.2","10.0.2.2","172.20.0.1","10.0.2.1"
        ],
        "key": {
            "algo": "ecdsa",
            "size": 256
        },
        "names": [
            {
                "C": "CN",
                "L": "SH",
                "ST": "SH"
            }
        ]
    }
    EOF
知识点：

+ hosts：表示哪些主机名(域名)或者IP可以使用此csr申请的证书，为空或者""表示所有的都可以使用(本例中没有hosts字段)

ps

`CN`字段 kube-apiserver 从证书中提取该字段作为请求的用户名 (User Name)；浏览器使用该字段验证网站是否合法

`hosts`字段不为空则需要指定授权使用该证书的 IP 或域名列表，如果该证书后续被etcd集群和kubernetes集群使用，则需要分别指定etcd集群、kubernetes集群master的主机IP和kubernetes服务的服务IP（一般是 kue-apiserver 指定的service-cluster-ip-range网段的第一个IP，如 10.254.0.1。方法如：cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=server -hostname=172.20.0.201,172.20.0.202,172.20.0.203 server-csr.json | cfssljson -bare server


#### 3).生成服务端证书和私钥

    cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=server server-csr.json | cfssljson -bare server

知识点：

+ -config 引用的是模板中的默认配置文件;
+ -profiles是指定特定的使用场景，比如ca-config.json中的server区域;


### 6.签发Client Certificate
#### 1).打印csr模版

    cfssl print-defaults csr > client-csr.json
    cat client-csr.json
        {
            "CN": "example.net",
            "hosts": [
                "example.net",
                "www.example.net"
            ],
            "key": {
                "algo": "ecdsa",
                "size": 256
            },
            "names": [
                {
                    "C": "US",
                    "L": "CA",
                    "ST": "San Francisco"
                }
            ]
        }
#### 2).修改csr请求模板

    cat <<EOF > client-csr.json
    {
        "CN": "Client",
        "hosts": [
            ""
        ],
        "key": {
            "algo": "ecdsa",
            "size": 256
        },
        "names": [
            {
                "C": "CN",
                "L": "SH",
                "ST": "SH"
            }
        ]
    }
    EOF
#### 3).生成客户端证书和私钥

    cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=client client-csr.json | cfssljson -bare client

### 7.签发peer certificate
#### 1).打印csr模版

    cfssl print-defaults csr > peer-csr.json
    cat peer-csr.json
        {
            "CN": "example.net",
            "hosts": [
                "example.net",
                "www.example.net"
            ],
            "key": {
                "algo": "ecdsa",
                "size": 256
            },
            "names": [
                {
                    "C": "US",
                    "L": "CA",
                    "ST": "San Francisco"
                }
            ]
        }

#### 2).修改csr请求模板
    cat <<EOF > peer-csr.json
    {
        "CN": "Peer",
        "hosts": [
            "127.0.0.1","172.20.0.201","172.20.0.202","172.20.0.203","172.20.0.2","10.0.2.2","172.20.0.1","10.0.2.1"
        ],
        "key": {
            "algo": "ecdsa",
            "size": 256
        },
        "names": [
            {
                "C": "CN",
                "L": "SH",
                "ST": "SH"
            }
        ]
    }
    EOF
#### 3).生成peer证书和私钥

    cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=peer peer-csr.json | cfssljson -bare peer

### 8.校验证书

校验生成的证书是否和配置相符

    openssl x509 -in ca.pem -text -noout
    openssl x509 -in server.pem -text -noout
    openssl x509 -in client.pem -text -noout

---
## 结束