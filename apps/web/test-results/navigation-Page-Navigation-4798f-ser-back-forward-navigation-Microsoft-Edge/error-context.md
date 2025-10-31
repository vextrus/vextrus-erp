# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e3]:
    - generic [ref=e4]:
      - heading "Welcome to Vextrus ERP" [level=1] [ref=e5]
      - paragraph [ref=e6]: World-class Enterprise Resource Planning system for Bangladesh Construction & Real Estate
      - generic [ref=e7]:
        - generic [ref=e8] [cursor=pointer]:
          - heading "🏗️ Construction Management" [level=2] [ref=e9]
          - paragraph [ref=e10]: Complete project lifecycle management from planning to execution
        - generic [ref=e11] [cursor=pointer]:
          - heading "💰 Financial Control" [level=2] [ref=e12]
          - paragraph [ref=e13]: Advanced accounting with NBR compliance and real-time reporting
        - generic [ref=e14] [cursor=pointer]:
          - heading "📊 Analytics & Insights" [level=2] [ref=e15]
          - paragraph [ref=e16]: Data-driven decision making with comprehensive business intelligence
      - generic [ref=e17]:
        - link "Go to Dashboard" [ref=e18] [cursor=pointer]:
          - /url: /dashboard
        - link "Documentation" [ref=e19] [cursor=pointer]:
          - /url: /docs
  - region "Notifications alt+T"
  - alert [ref=e23]
```