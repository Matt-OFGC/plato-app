// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "PlatoShared",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "PlatoShared",
            targets: ["PlatoShared"]),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "PlatoShared",
            dependencies: []),
        .testTarget(
            name: "PlatoSharedTests",
            dependencies: ["PlatoShared"]),
    ]
)




