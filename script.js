document.addEventListener('DOMContentLoaded', function() {
    // 基础元素
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const compressBtn = document.getElementById('compressBtn');
    const batchDownloadBtn = document.getElementById('batchDownloadBtn');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const maxWidthInput = document.getElementById('maxWidth');
    const formatSelect = document.getElementById('format');
    const resultsDiv = document.getElementById('results');
    const performanceInfo = document.getElementById('performanceInfo');
    const compressionMode = document.getElementById('compressionMode');
    const advancedOptions = document.getElementById('advancedOptions');
    const advancedContent = document.getElementById('advancedContent');
    const chromaSubsampling = document.getElementById('chromaSubsampling');
    const pngCompression = document.getElementById('pngCompression');
    const pngCompressionValue = document.getElementById('pngCompressionValue');
    const webpMethod = document.getElementById('webpMethod');
    const webpMethodValue = document.getElementById('webpMethodValue');
    
    // 高级选项切换
    advancedOptions.addEventListener('change', function() {
        advancedContent.style.display = this.checked ? 'block' : 'none';
    });
    
    // PNG压缩级别显示
    pngCompression.addEventListener('input', function() {
        pngCompressionValue.textContent = this.value;
    });
    
    // WebP方法显示
    webpMethod.addEventListener('input', function() {
        webpMethodValue.textContent = this.value;
    });
    
    let filesToCompress = [];
    let compressedFiles = [];
    
    // 更新质量显示
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = Math.round(this.value * 100) + '%';
    });
    
    // 拖放功能
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    function handleFiles(files) {
        filesToCompress = Array.from(files).filter(file => file.type.startsWith('image/'));
        compressedFiles = [];
        
        if (filesToCompress.length > 0) {
            compressBtn.disabled = false;
            batchDownloadBtn.disabled = true;
            showPreview(filesToCompress);
        } else {
            compressBtn.disabled = true;
            batchDownloadBtn.disabled = true;
            resultsDiv.innerHTML = '<p class="small">请选择有效的图片文件</p>';
        }
    }
    
    function showPreview(files) {
        resultsDiv.innerHTML = '';
        performanceInfo.textContent = '';
        
        files.forEach(file => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                
                resultItem.innerHTML = `
                    <div class="result-info">
                        <div class="file-info">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${formatFileSize(file.size)}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress" id="progress-${file.name}"></div>
                        </div>
                        <div class="compression-stats" id="stats-${file.name}"></div>
                    </div>
                    <img class="result-image" src="${e.target.result}" alt="预览">
                `;
                
                resultsDiv.appendChild(resultItem);
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // 批量下载
    batchDownloadBtn.addEventListener('click', function() {
        if (compressedFiles.length === 0) return;
        
        // 创建一个临时zip文件
        const zip = new JSZip();
        const folder = zip.folder("compressed_images");
        
        compressedFiles.forEach(file => {
            folder.file(file.name, file.blob);
        });
        
        zip.generateAsync({type: "blob"}).then(content => {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'compressed_images.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    });
    
    compressBtn.addEventListener('click', async function() {
        if (filesToCompress.length === 0) return;
        
        compressBtn.disabled = true;
        compressBtn.textContent = '压缩中...';
        performanceInfo.textContent = '开始压缩...';
        
        const startTime = performance.now();
        
        try {
            await compressImages(filesToCompress);
            
            const endTime = performance.now();
            const totalTime = ((endTime - startTime) / 1000).toFixed(2);
            
            performanceInfo.textContent = `所有图片压缩完成! 总耗时: ${totalTime}秒`;
            compressBtn.textContent = '压缩完成';
            batchDownloadBtn.disabled = false;
        } catch (error) {
            console.error('压缩出错:', error);
            performanceInfo.textContent = '压缩过程中出现错误: ' + error.message;
            compressBtn.textContent = '开始压缩';
            compressBtn.disabled = false;
        }
    });
    
    async function compressImages(files) {
        const quality = parseFloat(qualitySlider.value);
        const maxWidth = parseInt(maxWidthInput.value);
        const format = formatSelect.value;
        const mode = compressionMode.value;
        const subsampling = chromaSubsampling.value;
        const pngLevel = parseInt(pngCompression.value);
        const webpMethodVal = parseInt(webpMethod.value);
        
        // 根据压缩模式调整参数
        let config = {
            quality: quality,
            maxWidth: maxWidth,
            format: format,
            subsampling: subsampling,
            pngLevel: pngLevel,
            webpMethod: webpMethodVal
        };
        
        if (mode === 'speed') {
            config.quality = Math.min(0.7, quality);
            config.subsampling = '4:2:0';
            config.pngLevel = 3;
            config.webpMethod = 2;
        } else if (mode === 'quality') {
            config.subsampling = '4:4:4';
            config.pngLevel = 9;
            config.webpMethod = 6;
        }
        
        // 使用Promise.all并行压缩，但限制并发数量以避免内存问题
        const CONCURRENCY_LIMIT = 3;
        const batches = [];
        
        for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
            const batch = files.slice(i, i + CONCURRENCY_LIMIT);
            batches.push(batch);
        }
        
        for (const batch of batches) {
            await Promise.all(batch.map(file => 
                compressImage(file, config).catch(error => {
                    console.error(`压缩 ${file.name} 时出错:`, error);
                    updateProgress(file.name, -1); // 标记为错误
                    return null;
                })
            ));
        }
    }
    
    function compressImage(file, config) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const startTime = performance.now();
            
            reader.onload = async function(event) {
                try {
                    const img = new Image();
                    
                    img.onload = async function() {
                        // 计算新尺寸
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > config.maxWidth) {
                            height = Math.round((height * config.maxWidth) / width);
                            width = config.maxWidth;
                        }
                        
                        // 创建canvas
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        
                        const ctx = canvas.getContext('2d');
                        
                        // 使用更高性能的图像渲染方式
                        if (config.mode === 'speed') {
                            ctx.imageSmoothingEnabled = false;
                        } else {
                            ctx.imageSmoothingQuality = 'high';
                        }
                        
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // 确定输出格式
                        let outputFormat = config.format === 'auto' ? 
                            getOptimalFormat(file.type, config.quality) : 
                            config.format;
                        
                        // 更新进度
                        let progress = 0;
                        const progressInterval = setInterval(() => {
                            progress = Math.min(progress + 5, 90);
                            updateProgress(file.name, progress);
                        }, 100);
                        
                        // 使用更高效的压缩方法
                        let blob;
                        const startCompressTime = performance.now();
                        
                        try {
                            if (outputFormat === 'avif') {
                                // AVIF格式压缩
                                blob = await compressWithAVIF(canvas, config.quality);
                            } else if (outputFormat === 'webp') {
                                // WebP格式压缩
                                blob = await canvasToBlob(canvas, `image/webp`, config.quality, config.webpMethod);
                            } else if (outputFormat === 'png') {
                                // PNG格式压缩
                                blob = await canvasToBlob(canvas, `image/png`, null, config.pngLevel);
                            } else {
                                // JPEG格式压缩
                                const subsampling = getSubsamplingValue(config.subsampling);
                                blob = await canvasToBlob(canvas, `image/jpeg`, config.quality, subsampling);
                            }
                        } catch (error) {
                            clearInterval(progressInterval);
                            reject(error);
                            return;
                        }
                        
                        clearInterval(progressInterval);
                        
                        if (!blob) {
                            updateProgress(file.name, -1);
                            reject(new Error('压缩失败'));
                            return;
                        }
                        
                        const endTime = performance.now();
                        const compressionTime = ((endTime - startCompressTime) / 1000).toFixed(2);
                        const totalTime = ((endTime - startTime) / 1000).toFixed(2);
                        
                        // 计算压缩率
                        const originalSize = file.size;
                        const compressedSize = blob.size;
                        const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
                        
                        // 显示压缩统计信息
                        const statsDiv = document.getElementById(`stats-${file.name}`);
                        if (statsDiv) {
                            statsDiv.innerHTML = `
                                <span>压缩率: <span class="compression-ratio">${ratio}%</span></span>
                                <span>耗时: <span class="compression-time">${compressionTime}s</span></span>
                                <span>大小: ${formatFileSize(compressedSize)}</span>
                            `;
                        }
                        
                        // 创建下载链接
                        const url = URL.createObjectURL(blob);
                        const resultItem = document.querySelector(`#progress-${file.name}`).parentElement.parentElement.parentElement;
                        
                        const downloadLink = document.createElement('a');
                        downloadLink.href = url;
                        downloadLink.className = 'download-btn';
                        downloadLink.download = getOutputFileName(file.name, outputFormat);
                        downloadLink.textContent = `下载 (${formatFileSize(blob.size)})`;
                        
                        // 移除之前的下载按钮（如果有）
                        const oldLink = resultItem.querySelector('.download-btn');
                        if (oldLink) {
                            URL.revokeObjectURL(oldLink.href);
                            oldLink.remove();
                        }
                        
                        resultItem.appendChild(downloadLink);
                        
                        updateProgress(file.name, 100);
                        
                        // 保存压缩后的文件信息
                        compressedFiles.push({
                            name: getOutputFileName(file.name, outputFormat),
                            blob: blob
                        });
                        
                        resolve();
                    };
                    
                    img.onerror = function() {
                        reject(new Error('图片加载失败'));
                    };
                    
                    img.src = event.target.result;
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // 使用AVIF格式压缩
    async function compressWithAVIF(canvas, quality) {
        if (!window.createImageBitmap || !window.AVIF) {
            throw new Error('您的浏览器不支持AVIF格式压缩');
        }
        
        const bitmap = await createImageBitmap(canvas);
        const avifEncoder = new AVIF();
        
        return new Promise((resolve, reject) => {
            avifEncoder.encode(bitmap, {
                quality: Math.round(quality * 100),
                speed: 5 // 中等压缩速度
            }).then(blob => {
                resolve(blob);
            }).catch(error => {
                reject(error);
            });
        });
    }
    
    // 更高效的canvas转blob方法
    function canvasToBlob(canvas, mimeType, quality, extraParam) {
        return new Promise((resolve, reject) => {
            if (mimeType === 'image/jpeg') {
                // 对JPEG使用更高效的压缩方法
                canvas.toBlob(blob => {
                    if (!blob) {
                        reject(new Error('JPEG压缩失败'));
                        return;
                    }
                    resolve(blob);
                }, mimeType, quality);
            } else if (mimeType === 'image/png') {
                // 对PNG使用压缩级别
                const dataUrl = canvas.toDataURL(mimeType, extraParam / 9);
                const blob = dataURLToBlob(dataUrl);
                resolve(blob);
            } else if (mimeType === 'image/webp') {
                // 对WebP使用方法参数
                canvas.toBlob(blob => {
                    if (!blob) {
                        reject(new Error('WebP压缩失败'));
                        return;
                    }
                    resolve(blob);
                }, mimeType, quality);
            } else {
                // 默认方法
                canvas.toBlob(blob => {
                    if (!blob) {
                        reject(new Error('压缩失败'));
                        return;
                    }
                    resolve(blob);
                }, mimeType, quality);
            }
        });
    }
    
    function dataURLToBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], {type: mime});
    }
    
    function getSubsamplingValue(subsampling) {
        switch(subsampling) {
            case '4:4:4': return 0; // 无子采样
            case '4:2:2': return 1; // 水平子采样
            case '4:2:0': return 2; // 水平和垂直子采样
            default: return 2;
        }
    }
    
    function getOptimalFormat(mimeType, quality) {
        const type = mimeType.split('/')[1];
        
        // 根据质量选择最佳格式
        if (quality >= 0.9) {
            return type === 'png' ? 'png' : 'avif'; // 高质量时优先AVIF
        } else if (quality >= 0.7) {
            return 'webp'; // 中等质量WebP通常最佳
        } else {
            return 'jpeg'; // 低质量JPEG体积最小
        }
    }
    
    function updateProgress(fileName, percent) {
        const progressBar = document.getElementById(`progress-${fileName}`);
        
        if (!progressBar) return;
        
        if (percent === -1) {
            progressBar.style.backgroundColor = '#e74c3c';
            progressBar.style.width = '100%';
            return;
        }
        
        progressBar.style.width = `${percent}%`;
        
        if (percent === 100) {
            progressBar.style.backgroundColor = '#2ecc71';
        }
    }
    
    function getOutputFileName(originalName, format) {
        const nameWithoutExt = originalName.lastIndexOf('.') > 0 
            ? originalName.substring(0, originalName.lastIndexOf('.')) 
            : originalName;
            
        return `${nameWithoutExt}-compressed.${format}`;
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
地板{
    
数学====0日志字节数学
日志 K = 1024;
返回 parseFloat = ['Bytes', 'KB', 'MB', 'GB'];
?
:
字节 数学=乒. K.我/toFixed.' '
大小/我. /加载必要的 polyfill. 功能+''+查询为空[查询为空
学生代表会
        
/加载 AVIF你{
如果
类型 (AVIF === 'undefined') {
康斯特 = 我.查询为空
//加载 AVIF you='https://cdnjs.Cloudflore.com/ajax/libs/jszip/3.10.1/jszip.min.js'；（'script'）；
按键移动焦点。或者，使用
查询为空 (查询为空康斯特 === 'undefined') {
    
头附子 = 剧本.堆积土('script');
然后.突耳 = 'https://cdn.jsdelivr.net/npm/avif.js@1.0.0/dist/avif.min.js';
