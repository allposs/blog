---
title:          001-MAC使用pyenv+virtualenv打造多版本Python开发环境
date:           2020-01-10T10:20:23+08:00
draft:          true
tags:           [2020-01]
topics:         [python,mac]
---

## 简介

&nbsp;&nbsp;&nbsp;&nbsp;由于macOS 10.15.3默认使用的python版本是Python 2.7.16,但是系统本身内嵌了Python 3.7.3,导致在管理与使用上有点混乱,所以这里使用pyenv+virtualenv的方式管理python环境.
pyenv: 

    说明: 轻量的Python版本管理器，帮助你在一台机子上建立多个版本的python环境，并提供方便的切换方法。
    
    GitHub: https://github.com/yyuu/pyenv

pyenv-virtualenv: 

    说明: pyenv的扩展工具，可以搭建虚拟且独立的python环境，可以使每个项目环境与其他项目独立开来，保持环境的干净，解决包冲突问题。
    
    GitHub: https://github.com/yyuu/pyenv-virtualenv
<!--more-->

## 环境

macOS 10.15.3

## 软件包

无

## 拓扑图

无


## 正文
---
### 1. 安装
#### 1). 安装Xcode Command Line Tools

    xcode-select --install
    
#### 2). 安装Homebrew

    /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    
#### 3). 可选安装

    brew install openssl readline xz
    
#### 4). brew安装pyenv

    brew update
    
    brew install pyenv
    
    echo 'eval "$(pyenv init -)"' >> ~/.zshrc
    
#### 5). 安装pyenv-virtualenv

    git clone https://github.com/yyuu/pyenv-virtualenv.git ~/.pyenv/plugins/pyenv-virtualenv
    
#### 6). virtualenvs的自动激活

    echo 'eval "$(pyenv virtualenv-init -)"' >> ~/.zshrc
    
#### 7). 重新启动shell，以使路径更改生效

    exec $SHELL
    
    source ~/.zshrc

### 2. 命令

    pyenv命令集:

        pyenv install --list
        
            查询所有可以安装的版本
            
        pyenv install 2.7.14
            
            安装所需的版本
            
        pyenv uninstall
        
            卸载特定的Python版本。

        pyenv version
        
            显示当前活动的Python版本
            
        pyenv global 2.7.14
        
            Python的全局设置，整个系统生效
            
        pyenv global 2.7.14
        
            Python的局部设置，当前目录生效
            
        pyenv local --unset
        
            取消设置    

        更多参考GitHub...

    pyenv-virtualenv命令集:

        pyenv virtualenv 2.7.14 venv2714

            制定版本创建virtualenv
            
        pyenv virtualenvs
            
            列出现有virtualenvs
        
        pyenv activate virtualenv的名称
        
            激活pyenv virtualenv
            
        pyenv deactivate
        
            停用pyenv virtualenv

        pyenv uninstall my-virtual-env
        
            删除现有virtualenv


---
## 结束