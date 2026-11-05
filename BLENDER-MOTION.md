# Blender 动态作品导出

网页播放的是从提供的 Blender 场景渲染出的短片，源 `.blend` 不放进网站。本文件记录导出方法与展示调整。2026-11-04 六件作品的视频均已核验：五段新导出与既有波普动画，解码无错误，687 帧全部有不同的解码帧校验值。后续重导出应以输出目录中的状态文件及媒体核验结果为准。

## 原动画与展示运镜

| 作品 | 文件（相对 source-root） | 导出帧 | 速度 | 方式 |
| --- | --- | --- | --- | --- |
| 粒子 Logo | `70-苹果九月粒子logo/演示文件.blend` | 60–180，含首尾 | 24 fps，约 5.042 秒 | 原时间线片段，Eevee 网页预览 |
| 草地与风 | `Blender 动漫风草地/grass Do It With Me.blend` | 1–144 | 24 fps，6 秒 | 原场景时间节点驱动的风，原 Eevee 引擎 |
| 波普练习 | `BLENDER波普风格/blend练习1.blend` | 既有视频 110 帧 | 30 fps，约 3.667 秒 | 沿用已导出的 MP4；本脚本不重复渲染 |
| 液态玻璃 | `液态玻璃.blend` | 展示帧 1–72 | 24 fps，3 秒 | 新增相机摆动，Cycles |
| 云体 | `yun.blend` | 展示帧 1–96 | 24 fps，4 秒 | 新增相机摆动，Eevee 网页预览 |
| 有机方块 | `练习/有机方块.blend` | 1–144 | 24 fps，6 秒 | 原模拟节点及 `frame / 110` 驱动，原 Eevee 引擎 |

粒子、草地、方块使用原场景的时间逻辑，导出不重定时、不用图片平移代替动画。粒子只选取中段，因此不是完整 230 帧作品。已有波普短片保留自身 30 fps。

对当前提供的液态玻璃和云体文件逐项检查后，没有发现 Actions、驱动器、NLA、时间或模拟节点、动态修改器、形态键、粒子、刚体、视频序列或外部动画缓存；两份文件都只有一个场景，也没有嵌入脚本。液态玻璃是带倒角的静态玻璃网格；云体是固定随机种子的方块实例。它们的短片因此标为 **展示运镜**，不宣称为文件中已有的动画。若后来补充含原动画的文件，应替换短片及说明。

## 只在导出时应用的调整

- 不保存、不覆盖 `.blend`。启动时使用 `--disable-autoexec`，加载文件时使用 `use_scripts=False`，不会执行文件内 Python。
- 有机方块的一条现有驱动器以 `bpy.data...inputs[5].default_value / 2` 读取同一节点树的锥体高度。已检查该高度本身没有关键帧或驱动；脚本只匹配这一具体结构，读取高度并将驱动表达式替换为对应数值，避免同树 RNA 变量造成依赖循环。不执行任意表达式，也不开启自动脚本执行。真正随时间变化的 `frame / 110` 噪声驱动保留。
- 草地隐藏教程中的 `Cube`，与现有海报的展示选择一致。
- 云体没有相机，新增相机使用文件保存的视口方向；读取矩阵前先更新 view layer。液态玻璃使用已有相机。两者做轻微往返摆动，最大偏角 12°，不改变场景几何。
- 有机方块没有灯光，导出时补三盏临时演示灯。
- 只在图片路径失效且同名文件位于 `.blend` 同目录时重连贴图，不下载替代素材。
- 粒子和云体的网页版本选用 Eevee，因此光照、透射和噪声效果可能不同于原 Cycles 设置。液态玻璃仍用 Cycles，以保留玻璃材质表现。
- 输出宽度 960 px，保留原画面比例；高度取相邻偶数以适配 H.264。PNG 为 RGB 8-bit。Cycles 使用降噪，液态玻璃 32 samples；尽可能使用 OptiX，失败时保留可用设备设置。

## 可复现的导出

使用 Blender 4.5.3 LTS。`--source-root` 指向含上述相对文件的目录，`--output-root` 必须位于源目录之外。所有状态文件和 PNG 仅写入输出目录。

以下为 PowerShell 示例；请把示例路径换成自己的 Blender 程序及作品目录。在仓库根目录运行：

```powershell
$blenderExe = 'C:/Tools/blender-4.5.3/blender.exe'
$studySources = 'D:/BlenderWorks'
$renderOutput = 'D:/WebRenders/yo7'

# 先渲染三个检查帧。
& $blenderExe --background --factory-startup --disable-autoexec --python scripts/render-blender-motion.py -- grass --source-root $studySources --output-root $renderOutput --probe

# 检查构图、材质和不同帧的实际变化后，再导出全段。
& $blenderExe --background --factory-startup --disable-autoexec --python scripts/render-blender-motion.py -- grass --source-root $studySources --output-root $renderOutput
& $blenderExe --background --factory-startup --disable-autoexec --python scripts/render-blender-motion.py -- particles --source-root $studySources --output-root $renderOutput --eevee
& $blenderExe --background --factory-startup --disable-autoexec --python scripts/render-blender-motion.py -- organic --source-root $studySources --output-root $renderOutput
& $blenderExe --background --factory-startup --disable-autoexec --python scripts/render-blender-motion.py -- cloud --source-root $studySources --output-root $renderOutput --eevee --orbit
& $blenderExe --background --factory-startup --disable-autoexec --python scripts/render-blender-motion.py -- liquid --source-root $studySources --output-root $renderOutput --orbit
```

脚本逐帧推进模拟，即使导出片段从第 60 帧开始，也先计算此前帧；不能直接跳到末帧代替模拟。`--probe` 也会推进中间帧，但仅保存三张检查图。已存在的 PNG 默认跳过，`--force` 只用于明确需要重渲染时。若修改引擎、相机或光照，应使用新输出目录或加 `--force`，避免混用不同设置的帧。

输出目录名是作品 slug；加 `--eevee` 时附加 `-eevee`。状态文件为 `<slug>-status.json`，记录源设置、导出帧、fps、展示调整以及完成或错误状态。同一 slug 不应同时运行多个导出任务，否则状态文件会互相覆盖。

## 编码和核验

使用带 libx264 的 FFmpeg。对每件作品单独编码，不补帧、不变速。将同一 `-framerate` 用于帧序列输入；不要以 `-r` 强行把波普的 30 fps 改为 24 fps。

本次新增短片采用 CRF 20，草地采用 CRF 22。云体编码前另用 `-vf "hqdn3d=2:2:3:3"` 轻微空间与时间降噪，减轻 Eevee 体积采样颗粒；不做光流补帧，保留全部 96 个实际渲染帧。

```powershell
# 原时间线片段示例：60 到 180，共 121 帧。
ffmpeg -framerate 24 -start_number 60 -i "$renderOutput/particles-eevee/%04d.png" -frames:v 121 -an -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart "$renderOutput/particles-film.mp4"

# 展示运镜示例：1 到 72，共 72 帧。
ffmpeg -framerate 24 -start_number 1 -i "$renderOutput/liquid/%04d.png" -frames:v 72 -an -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart "$renderOutput/liquid-film.mp4"

# 检查容器、分辨率、实际帧数、fps 和时长。
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,nb_read_frames,duration -of json "$renderOutput/particles-film.mp4"

# 检查解码；输出不同时间点的图，再比较真实运动与画质。
ffmpeg -v error -i "$renderOutput/particles-film.mp4" -f null -
ffmpeg -i "$renderOutput/particles-film.mp4" -vf "fps=1,scale=480:-2,tile=3x2" -frames:v 1 "$renderOutput/particles-contact.png"
```

H.264 + `yuv420p` 便于浏览器播放，`+faststart` 把播放索引放到文件前部。核验后再复制到 `public/assets/works/<slug>/film.mp4` 并登记到 `src/portfolio.ts`；不要仅因文件存在就认定动画成功。应检查帧内容有实际变化、首尾构图正确、透明材质可辨认、时长符合表格，并确认短片来源说明正确。浏览器端还需检查暂停、拖动进度、离屏暂停及减少动态效果设置。

源文件路径、完整渲染序列和 Blender 程序属于本机工作资料，不随网站发布。海报作为尚未播放、节流设置或加载失败时的静态后备，不能替代可用的动画短片。
