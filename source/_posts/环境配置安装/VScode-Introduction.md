---
 title: VScode-Introduction 
 date: 2021-05-20 23:13:23 
 tags: 
 - 软件安装
 categories:
 - 环境配置安装
---
## 前言
> VSCode是微软推出的一款编译器，在Mac、Linux、Windows下都可以使用，听别人说挺好用，但是自己并没有尝试，现在是第一次使用，用它来写c++。
> 本篇博客主要是讲解一下VSCode写C++的配置
>
<!--more-->
## 一、VSCode下载安装
VSCode下载和安装比较简单，直接百度vscode然后进入官网就能够下载([官网传送门](https://code.visualstudio.com/)),可以参考下图：
![](https://gitee.com/bugcat9/BlogImage/raw/master/其他/download1.png)
![](https://gitee.com/bugcat9/BlogImage/raw/master/其他/download2.png)
VSCode安装比较简单，就不多解释了

## 二、下载C++编译器
vscode只是一个简单的IDE，说白了就是一个写txt的地方，所以我们还需要下载一个编译器。我选择的编译器是MinGW([下载传送门](https://sourceforge.net/projects/mingw-w64/))，下载后进行安装，安装之后直接打开会进入MinGW Installation Manaager界面，在左侧栏选择Basic Setup，然后右侧会出现7个包，我们只需要选中这七个包进行下载即可（如果有其他需求可以选择左侧的All Packages自行选择）。下载的方法是选中相对应的包然后按下鼠标右键选择“Mark For Installtion”，可以参考下图：
![](https://gitee.com/bugcat9/BlogImage/raw/master/其他/download3.png)
将想下载的包都选中之后，然点击菜单栏上的Installation选择Apply Changes，可以参考下图：
![](https://gitee.com/bugcat9/BlogImage/raw/master/其他/download4.png)
下载完成之后，C++编译器也算是完成了，最后将对应的MinGW的环境配置一下就行，简单来说就是将安装下载MinGW目录下的bin目录加到环境path当中，比如我MinGW安装的位置是：“D:\MinGW\bin”，就将“D:\MinGW\bin”加入到path当中就行，如果想测试是否安装成功，可以在cmd当中试下“g++ --version”、“gdb --version”是否都有结果如果都有则安装成功。

## 三、在VSCode当中配置C/C++环境
配置的大部分都是参考了VSCode的官方文档，翻了许多别人写的博客，许多因为版本问题其实在现在并不是很适用，后来看了官方提供的文档，才觉得豁然开朗。在vscode当中有个文件夹.vscode比较重要，里面会存放vscode的配置文件，对于本次比较重要的配置文件有三个，分别为：tasks.json（构建指令配置）、launch.json（调试设置）、c_cpp_properties.json（编译路径路径配置）

### 1.安装VSCode中的C/C++插件
在Extensions（Ctrl+Shift+X）当中搜索C++进行安装,如下图：
![](https://gitee.com/bugcat9/BlogImage/raw/master/其他/download5.png)

### 2.创建hello.cpp文件
找一个空的目录（当作工作空间）在里面创建hello.cpp文件，然后用VSCode打开,在里面写下如下的代码：
```c++
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main()
{
   vector<string> msg {"Hello", "C++", "World", "from", "VS Code", "and the C++ extension!"};

   for (const string& word : msg)
   {
      cout << word << " ";
   }
   cout << endl;
}
```
参考图如下：
![](https://gitee.com/bugcat9/BlogImage/raw/master/其他/download6.png)

### 3.创建tasks.json文件
接下来，我们需要创建一个tasks.json文件来告诉VS Code如何构建（编译）程序。但是这个文件不要我们手动创建，具体可以看下面。
我们在主菜单中选择**终端（Terminal ）>配置默认生成任务（Configure Default Build Task）**。在弹出来的下拉列表中，选择**g++.exe build active file**，点击之后他会自动生成.vscod文件夹,并且里面会自动生成tasks.json文件。
![](https://gitee.com/bugcat9/BlogImage/raw/master/其他/download7.png)
然后我们需要在tasks.json里面写下

```json
{
// 有关 tasks.json 格式的文档，请参见
    // https://go.microsoft.com/fwlink/?LinkId=733558
    "version": "2.0.0",
    "tasks": [
        {
            "type": "shell",
            "label": "g++.exe build active file",   
            "command": "D:\\MinGW\\bin\\g++.exe",   //对应自己下载的目录,换一下安装位置
            "args": [
                "-g",
                "${file}",
                "-o",
                "${fileDirname}\\${fileBasenameNoExtension}.exe"
            ],
            "options": {
                "cwd": "D:\\MinGW\\bin"  //对应自己下载的目录,换一下安装位置
            },
            "problemMatcher": [
                "$gcc"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            }
        }
    ]
}
```

完成上诉步骤之后你就可以直接运行程序,会生成对应的exe应该可以看见（按下ctrl+shit+B可以运行）。

### 4.创建launch.json文件
目前我们并不能对代码进行调试，要想进行调试需要创建aunch.json文件，同理也不需要我们自己创建,可以选择在调试界面选择“创建launch.json文件”，或者在菜单栏中选择**调试 > 添加配置.**，然后选择**C ++（GDB / LLDB）**，然后选择**g++.exe build and debug active file.**
![](https://gitee.com/bugcat9/BlogImage/raw/master/其他/download9.png)
然后在launch.json文件中写下如下内容：

```json
{
    
  "version": "0.2.0",
  "configurations": [
    {
      "name": "g++.exe build and debug active file",
      "type": "cppdbg",
      "request": "launch",
      "program": "${fileDirname}\\${fileBasenameNoExtension}.exe",
      "args": [],
      "stopAtEntry": false,
      "cwd": "${workspaceFolder}",
      "environment": [],
      "externalConsole": false,
      "MIMode": "gdb",
      "miDebuggerPath": "D:\\MinGW\\bin\\gdb.exe",      //更改到自己的目录下
      "setupCommands": [
        {
          "description": "Enable pretty-printing for gdb",
          "text": "-enable-pretty-printing",
          "ignoreFailures": true
        }
      ],
      "preLaunchTask": "g++.exe build active file"
    }
  ]
}
```
完成上述事情之后就可以设置断点进行相对应的调试了
### 5.设置C/C++配置
按下**Ctrl+Shift+P** 打开搜索界面然后选择**C/C++: Edit Configurations (UI)**
![](https://gitee.com/bugcat9/BlogImage/raw/master/其他/download10.png)
选择左下角的**c_cpp_properties.json 文件**
![](https://gitee.com/bugcat9/BlogImage/raw/master/其他/download11.png)
编写c_cpp_properties.json内容如下：

```json
{
    "configurations": [
        {
            "name": "Win32",
            "includePath": [
                "${workspaceFolder}/**"
            ],
            "defines": [
                "_DEBUG",
                "UNICODE",
                "_UNICODE"
            ],
            "compilerPath": "D:\\MinGW\\bin\\gcc.exe",
            "cStandard": "c11",
            "cppStandard": "c++17",
            "intelliSenseMode": "clang-x86"
        }
    ],
    "version": 4
}
```
**可以根据自己安装路径将compilerPath的对应目录进行更换**

## 总结
完成上述步骤之后，就能使用vscode进行相对应的C++编写了，不得不说vscode还是挺香的