---
title: 使用Github Action实现Android自动打包
date: 2021-09-23 10:48:28
tags:
categories:
---

# 使用Github Action实现Android自动打包

Github Action是个好东西，我使用他实现了hexo自动打包上传，然后我就在想能否使用Github Action打包写好的Android代码，打包好Android的包apk，经过我在网上查找资料发现这个功能是完全可以实现的

## Android命令行打包

Android 命令行打包可以参考官方文档https://developer.android.com/studio/build/building-cmdline?hl=zh-cn#sign_cmdline

想在Github Action上进行打包，首先要明白如何在本地使用命令行进行打包，这样才能在在Github Action，配置对应的环境然后使用对应的命令进行打包。

因为我们是想要打包那种有签名的apk文件，所以得使用jks文件，现在Android打包签名使用的是jks文件。

首先我们需要生成jks文件，我们可以使用Android Studio进行生成

![image-20210927194715475](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210927194715475.png)

![image-20210923114803611](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210923114803611.png)

接着为了方便，在项目的根目录下创建一个名为 `keystore.properties` 的文件。此文件应当包含签名信息，如下所示：

```properties
storePassword=myStorePassword
keyPassword=mykeyPassword
keyAlias=myKeyAlias
storeFile=myStoreFileLocation
```

在模块的 `build.gradle` 文件中，在 `android {}` 块的前面添加用于加载 `keystore.properties` 文件的代码。

```groovy
...

// Create a variable called keystorePropertiesFile, and initialize it to your
// keystore.properties file, in the rootProject folder.
def keystorePropertiesFile = rootProject.file("keystore.properties")

// Initialize a new Properties() object called keystoreProperties.
def keystoreProperties = new Properties()

// Load your keystore.properties file into the keystoreProperties object.
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
    ...
}
```

修改模块的 `build.gradle` 文件的 `signingConfigs` 块，以便使用此语法引用存储在 `keystoreProperties` 中的签名信息。

```groovy
android {
    signingConfigs {
        config {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.config //配置签名文件
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    ...
  }
```

然后我们在命令行中输入命令

```cmd
gradlew assembleRelease
```

![image-20210927203126908](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210927203126908.png)

![image-20210927203156145](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210927203156145.png)

可以看到最终生成的release版的apk文件，说明Android命令行打包成功

## 使用GitHub Action打包

我们在项目根目录下创建.github/workflows/build_apk.yml这样的文件，它是GitHub Action的配置文件

需要在GitHub Action上配置环境，可以看下面的配置这样可以打包出apk

```yml
jobs:
  build:

    runs-on: ubuntu-latest
    # 设置jdk环境为1.8
    steps:
      - uses: actions/checkout@v2
      - name: set up JDK 1.8
        uses: actions/setup-java@v1
        with:
          java-version: 1.8

      # 打包release
      - name: Build with Gradle
        run: bash ./gradlew assembleRelease
```

打包出apk后我们需要把apk进行上传，下面的方法是进行上传，上传之后可以在GitHub Action上看到

```yml
      #step：上传apk 到action，在右上角查看
      # 官方文档 https://help.github.com/cn/actions/automating-your-workflow-with-github-actions/persisting-workflow-data-using-artifacts#uploading-build-and-test-artifacts
      - name: Upload APK
        uses: actions/upload-artifact@v2
        with:
          name: app
          path: app/build/outputs/apk/release/app-release.apk
```

上传的结果

![image-20210927204736195](https://cdn.jsdelivr.net/gh/zhou-ning/blog-image-bed@main/android/image-20210927204736195.png)

但是光在这里上传并不会进行release发布，所以我们接着加

```yml
      # 创建realease
      - name: Create Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
      # 上传apk到release
      - name: Upload Release Asset
        id: upload-release-asset
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          # This pulls from the CREATE RELEASE step above, referencing it's ID to get its outputs object, which include a `upload_url`.
          # See this blog post for more info: https://jasonet.co/posts/new-features-of-github-actions/#passing-data-to-future-steps
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: app/build/outputs/apk/release/app-release.apk
          asset_name: App.apk
          asset_content_type: application/vnd.android.package-archiv
```

这个是上传到release上，但是这个按照教程似乎只能使用tag进行，因为这样`github.ref `才有意义

可以看到我们上传一个tag之后，最终效果是这样的

![image-20210927205713787](新建文件夹/image-20210927205713787.png)

## 使用secret

上面这样做只能使用私人仓库，因为在`keystore.properties`里面写着密码和别名，如果开源别人就能下载然后用这个jks打包，这肯定不好，所以我们使用secret，在配置环境的时候使用sed更改密码。

在仓库的setting中我们加入`ALIAS`和`PASSWORD`两个secret，其中就是jks的别名和密码(这里我将storePassword和keyPassword设置的一样，所以只有一个密码)

![image-20210929170814946](新建文件夹/image-20210929170814946.png)

更改`keystore.properties`为

```properties
storePassword=123
keyPassword=123
keyAlias=123
storeFile=../App.jks
```

更改打包命令

```yaml
jobs:
  build:

    runs-on: ubuntu-latest
    # 设置jdk环境为1.8
    steps:
      - uses: actions/checkout@v2
      - name: set up JDK 1.8
        uses: actions/setup-java@v1
        with:
          java-version: 1.8

      # 打包release
      - name: Build with Gradle
        env:
          PASSWORD: ${{ secrets.PASSWORD }}
          ALIAS: ${{ secrets.ALIAS }}
        run: |
          sed -i "1s/123/$PASSWORD/" keystore.properties
          sed -i "2s/123/$PASSWORD/" keystore.properties
          sed -i "3s/123/$ALIAS/" keystore.properties
          bash ./gradlew assembleRelease
```

这里我们使用了sed命令更改了`keystore.properties`中的数据，这样就不会泄露秘密和别名，也就达到了安全的目的

## 总结

最后的配置文件是这样的

```yaml
name: Android CI

# 触发器
on:
  push:
    tags:
      - '*'

jobs:
  build:

    runs-on: ubuntu-latest
    # 设置jdk环境为1.8
    steps:
      - uses: actions/checkout@v2
      - name: set up JDK 1.8
        uses: actions/setup-java@v1
        with:
          java-version: 1.8

      # 打包release
      - name: Build with Gradle
        env:
          PASSWORD: ${{ secrets.PASSWORD }}
          ALIAS: ${{ secrets.ALIAS }}
        run: |
          sed -i "1s/123/$PASSWORD/" keystore.properties
          sed -i "2s/123/$PASSWORD/" keystore.properties
          sed -i "3s/123/$ALIAS/" keystore.properties
          bash ./gradlew assembleRelease

      #step：上传apk 到action，在右上角查看
      # 官方文档 https://help.github.com/cn/actions/automating-your-workflow-with-github-actions/persisting-workflow-data-using-artifacts#uploading-build-and-test-artifacts
      - name: Upload APK
        uses: actions/upload-artifact@v2
        with:
          name: app
          path: app/build/outputs/apk/release/app-release.apk

      # 创建realease
      - name: Create Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
      # 上传apk到release
      - name: Upload Release Asset
        id: upload-release-asset
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          # This pulls from the CREATE RELEASE step above, referencing it's ID to get its outputs object, which include a `upload_url`.
          # See this blog post for more info: https://jasonet.co/posts/new-features-of-github-actions/#passing-data-to-future-steps
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: app/build/outputs/apk/release/app-release.apk
          asset_name: App.apk
          asset_content_type: application/vnd.android.package-archiv
```

使用github Action进行打包发布就写到这里。

参考：

* https://developer.android.google.cn/studio/build/building-cmdline?hl=ru#ReleaseMode
* https://blog.csdn.net/ZZL23333/article/details/115798615
* https://xuexuan.blog.csdn.net/article/details/103921480?utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromBaidu%7Edefault-5.control&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromBaidu%7Edefault-5.control