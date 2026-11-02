import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// Lossless extraction only: never paints, resizes, removes backgrounds or overwrites sheets.
// Usage: swift slice.swift sheet.png columns rows output-directory name1,name2,...
let args = CommandLine.arguments
guard args.count == 6, let rows = Int(args[3]), rows > 0 else {
    fatalError("Usage: slice.swift sheet.png columns rows output-directory names-separated-by-comma")
}
let automatic = args[2].hasPrefix("auto:")
let columnArgument = automatic ? String(args[2].dropFirst(5)) : args[2]
let boundaries: [Double]
if let count = Int(columnArgument), count > 0 { boundaries = (0...count).map { Double($0)/Double(count) } }
else { boundaries = args[2].split(separator:",").compactMap { Double($0) } }
guard boundaries.count >= 2, boundaries.first == 0, boundaries.last == 1,
    zip(boundaries, boundaries.dropFirst()).allSatisfy({ $0 < $1 }) else { fatalError("Invalid column boundaries") }
let columns = boundaries.count - 1
let names = args[5].split(separator: ",").map(String.init)
guard names.count == columns * rows else { fatalError("Name count does not match grid") }
guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil),
      let original = CGImageSourceCreateImageAtIndex(source, 0, nil) else { fatalError("Cannot read source") }
let directory = URL(fileURLWithPath: args[4], isDirectory: true)
try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
var detected: [CGRect] = []
if automatic {
    let w = original.width, h = original.height
    var rgba = [UInt8](repeating: 0, count: w*h*4)
    rgba.withUnsafeMutableBytes { buffer in
        let ctx = CGContext(data: buffer.baseAddress, width: w, height: h, bitsPerComponent: 8,
            bytesPerRow: w*4, space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue)!
        ctx.draw(original, in: CGRect(x: 0, y: 0, width: w, height: h))
    }
    var visited = [Bool](repeating: false, count: w*h)
    var components: [(Int,CGRect)] = []
    for seed in 0..<(w*h) where !visited[seed] && rgba[seed*4+3] > 24 {
        var queue = [seed], cursor = 0
        visited[seed] = true
        var minX = w, minY = h, maxX = 0, maxY = 0
        while cursor < queue.count {
            let p = queue[cursor]; cursor += 1
            let x = p%w, y = p/w
            minX = min(minX,x); maxX = max(maxX,x); minY = min(minY,y); maxY = max(maxY,y)
            var neighbors: [Int] = []
            if x > 0 { neighbors.append(p-1) }; if x+1 < w { neighbors.append(p+1) }
            if y > 0 { neighbors.append(p-w) }; if y+1 < h { neighbors.append(p+w) }
            for q in neighbors where !visited[q] && rgba[q*4+3] > 24 { visited[q] = true; queue.append(q) }
        }
        if queue.count > w*h/(names.count*200) {
            components.append((queue.count,CGRect(x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1)))
        }
    }
    components.sort { $0.0 > $1.0 }
    guard components.count >= names.count else { fatalError("Objects touch or lack clear alpha separation; regenerate \(args[1])") }
    let largest = Array(components.prefix(names.count))
    for index in names.indices {
        let cx = (Double(index%columns)+0.5)*Double(w)/Double(columns)
        let cy = (Double(index/columns)+0.5)*Double(h)/Double(rows)
        let nearest = largest.min { a,b in
            pow(Double(a.1.midX)-cx,2)+pow(Double(a.1.midY)-cy,2) < pow(Double(b.1.midX)-cx,2)+pow(Double(b.1.midY)-cy,2)
        }!.1
        guard !detected.contains(nearest) else { fatalError("Ambiguous object placement; regenerate source") }
        detected.append(nearest.insetBy(dx:-5,dy:-5).intersection(CGRect(x:0,y:0,width:w,height:h)).integral)
    }
}
var records: [[String: Any]] = []
for index in names.indices {
    let column = index % columns, row = index / columns
    let x0 = Int((boundaries[column] * Double(original.width)).rounded())
    let x1 = Int((boundaries[column+1] * Double(original.width)).rounded())
    let y0 = Int((Double(row) * Double(original.height) / Double(rows)).rounded())
    let y1 = Int((Double(row + 1) * Double(original.height) / Double(rows)).rounded())
    let region = automatic ? detected[index] : CGRect(x: x0, y: y0, width: x1-x0, height: y1-y0)
    let cell = original.cropping(to: region)!
    let w = cell.width, h = cell.height
    var pixels = [UInt8](repeating: 0, count: w*h*4)
    pixels.withUnsafeMutableBytes { buffer in
        let ctx = CGContext(data: buffer.baseAddress, width: w, height: h, bitsPerComponent: 8,
            bytesPerRow: w*4, space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue)!
        ctx.draw(cell, in: CGRect(x: 0, y: 0, width: w, height: h))
    }
    var minX = w, minY = h, maxX = -1, maxY = -1, transparent = 0
    for y in 0..<h { for x in 0..<w {
        let alpha = pixels[(y*w+x)*4+3]
        if alpha < 8 { transparent += 1 }
        if alpha > 8 { minX = min(minX,x); minY = min(minY,y); maxX = max(maxX,x); maxY = max(maxY,y) }
    }}
    guard maxX >= minX, maxY >= minY else { fatalError("Empty cell: \(names[index])") }
    guard transparent > w*h/100 else { fatalError("Missing genuine transparency: \(names[index]); regenerate source") }
    // Small transparent safety margin; retain original alpha and original pixels.
    minX = max(0,minX-3); minY = max(0,minY-3); maxX = min(w-1,maxX+3); maxY = min(h-1,maxY+3)
    let rect = CGRect(x: minX, y: minY, width: maxX-minX+1, height: maxY-minY+1)
    let crop = cell.cropping(to: rect)!
    let output = directory.appendingPathComponent(names[index]+".png")
    guard !FileManager.default.fileExists(atPath: output.path) else { fatalError("Refusing overwrite: \(output.path)") }
    let destination = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(destination, crop, nil)
    guard CGImageDestinationFinalize(destination) else { fatalError("Cannot save \(output.path)") }
    records.append(["id": names[index], "file": names[index]+".png", "source": URL(fileURLWithPath: args[1]).lastPathComponent,
        "cell": [Int(region.minX),Int(region.minY),Int(region.width),Int(region.height)], "crop": [Int(region.minX)+minX,Int(region.minY)+minY,Int(rect.width),Int(rect.height)],
        "width": crop.width, "height": crop.height, "transparentFraction": Double(transparent)/Double(w*h)])
}
let data = try JSONSerialization.data(withJSONObject: records, options: [.prettyPrinted,.sortedKeys])
try data.write(to: directory.appendingPathComponent(URL(fileURLWithPath: args[1]).deletingPathExtension().lastPathComponent+".crops.json"))
print("Extracted \(names.count) transparent sprites from \(original.width)x\(original.height)")
