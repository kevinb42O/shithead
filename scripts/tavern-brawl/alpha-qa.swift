import Foundation
import CoreGraphics
import ImageIO
var records: [[String:Any]] = []
for file in CommandLine.arguments.dropFirst() {
    guard let source=CGImageSourceCreateWithURL(URL(fileURLWithPath:file) as CFURL,nil),let image=CGImageSourceCreateImageAtIndex(source,0,nil) else { fatalError(file) }
    let w=image.width,h=image.height
    var rgba=[UInt8](repeating:0,count:w*h*4)
    rgba.withUnsafeMutableBytes { buffer in
        let ctx=CGContext(data:buffer.baseAddress,width:w,height:h,bitsPerComponent:8,bytesPerRow:w*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue|CGBitmapInfo.byteOrder32Big.rawValue)!
        ctx.draw(image,in:CGRect(x:0,y:0,width:w,height:h))
    }
    var edgeMax:UInt8=0,solidEdge=0,transparent=0
    for y in 0..<h { for x in 0..<w {
        let alpha=rgba[(y*w+x)*4+3]
        if alpha==0 { transparent += 1 }
        if x==0||y==0||x==w-1||y==h-1 { edgeMax=max(edgeMax,alpha);if alpha>128 { solidEdge += 1 } }
    }}
    records.append(["file":URL(fileURLWithPath:file).lastPathComponent,"edgeMaxAlpha":edgeMax,"solidEdgePixels":solidEdge,"fullyTransparentFraction":Double(transparent)/Double(w*h)])
}
let data=try JSONSerialization.data(withJSONObject:records,options:[.prettyPrinted,.sortedKeys])
print(String(data:data,encoding:.utf8)!)
