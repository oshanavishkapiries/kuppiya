# Go Dependencies Management - Quick Reference

## 📦 **Initialize Module**
```bash
go mod init github.com/username/projectname
# Creates go.mod file
```

## ➕ **Add Dependencies**
```bash
go get github.com/gin-gonic/gin@latest    # Latest version
go get github.com/gin-gonic/gin@v1.9.1    # Specific version
go get ./...                               # Add all missing imports
```

## 🔄 **Update Dependencies**
```bash
go get -u                                  # Update all dependencies
go get -u ./...                           # Update all in current module
go get -u github.com/gin-gonic/gin        # Update specific package
go get -u=patch ./...                     # Update to latest patch versions
```

## 🧹 **Clean Up**
```bash
go mod tidy                               # Remove unused, add missing deps
go mod download                           # Pre-download dependencies
go mod verify                             # Verify dependencies unchanged
```

## 📋 **List & Check**
```bash
go list -m all                            # List all dependencies
go list -m -versions github.com/gin-gonic/gin  # Available versions
go mod graph                              # Show dependency graph
go mod why github.com/some/package       # Why is this package needed?
```

## 🔄 **Replace Dependencies**
```go
// In go.mod file
replace github.com/old/pkg => github.com/new/pkg v1.0.0
replace github.com/pkg => ./local-folder  // Local development
```

## 🔒 **Vendor Dependencies**
```bash
go mod vendor                             # Create vendor folder
go build -mod=vendor                      # Build using vendor folder
```

## ⬇️ **Downgrade/Remove**
```bash
go get github.com/pkg@v1.2.3             # Downgrade to specific version
go get github.com/pkg@none               # Remove dependency (then go mod tidy)
```

## 🆕 **Upgrade Go Version**
```bash
go mod edit -go=1.21                     # Update Go version in go.mod
```

## 🔍 **Common Workflows**

### **Start New Project**
```bash
mkdir myproject && cd myproject
go mod init github.com/me/myproject
# Start coding, imports will be added automatically
go mod tidy
```

### **Clone & Run Existing Project**
```bash
git clone https://github.com/someone/project
cd project
go mod download    # Download dependencies
go run .          # Run project
```

### **Fix Broken Dependencies**
```bash
go mod tidy       # Clean up first
go clean -modcache # Clear cache if corrupted
go mod download   # Re-download
```

## 📝 **go.mod File Structure**
```go
module github.com/username/project

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/lib/pq v1.10.9
)

require (
    // indirect dependencies auto-managed
)

replace github.com/broken/pkg => github.com/fork/pkg v1.0.0
```

## 💡 **Quick Tips**
- `go.mod` = Dependencies list
- `go.sum` = Checksums for security (commit both to git)
- Dependencies cached in `$GOPATH/pkg/mod`
- Use `go mod tidy` after manual go.mod edits
- IDE usually runs `go get` automatically when you add imports