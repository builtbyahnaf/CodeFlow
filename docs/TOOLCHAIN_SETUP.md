# CodeFlow Toolchain Setup Guide

CodeFlow is designed to be **frictionless**: it comes with a built-in pure JavaScript syntactic analyzer that extracts functions, control flow graphs, call hierarchies, and basic data flow directly from your source files without requiring any compilers or external tools.

However, for compiler-grade AST semantics, template instantiations, macro expansions, and precise type deduction in C and C++, CodeFlow can leverage an installed **Clang / LLVM** toolchain.

---

## Windows Setup

### Option 1: Official LLVM Installer (Recommended)
1. Download the pre-built Windows binary (e.g. `LLVM-<version>-win64.exe`) from the [LLVM Releases Page](https://github.com/llvm/llvm-project/releases).
2. During installation, select **"Add LLVM to the system PATH"**.
3. CodeFlow will automatically detect `clang++.exe` in `PATH` or in `C:\Program Files\LLVM\bin\clang++.exe`.

### Option 2: Windows Package Manager (winget)
```powershell
winget install LLVM.LLVM
```

### Option 3: Chocolatey
```powershell
choco install llvm
```

### Option 4: MSYS2 / MinGW-w64
If you use MSYS2:
```bash
pacman -S mingw-w64-x86_64-clang
```
CodeFlow automatically probes `C:\msys64\mingw64\bin\clang++.exe`.
