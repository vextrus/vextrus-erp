#!/bin/bash
# MCP Server Toggle Script for Git Bash / Linux
# Usage: ./mcp-toggle.sh [enable|disable|status|list] [docs|database|testing|research|full]

ACTION=$1
PROFILE=$2
BASE_CONFIG=".mcp.json"
BACKUP_CONFIG=".mcp.json.current-backup"

show_status() {
    echo -e "\n=== Current MCP Configuration ==="
    if [ -f "$BASE_CONFIG" ]; then
        server_count=$(jq '.mcpServers | length' "$BASE_CONFIG")
        echo -e "Active servers: $server_count"
        echo -e "\nEnabled MCP Servers:"
        jq -r '.mcpServers | keys[]' "$BASE_CONFIG" | sed 's/^/  - /'
    else
        echo "No MCP configuration found!"
    fi
    echo ""
}

show_profiles() {
    echo -e "\n=== Available MCP Profiles ==="
    echo "  core      - Minimal setup (filesystem, github, postgres, serena, sequential-thinking)"
    echo "  docs      - Documentation lookup (context7, consult7)"
    echo "  database  - Database tools (prisma-local, sqlite)"
    echo "  testing   - Browser automation (playwright)"
    echo "  research  - Web research (brave-search, brightdata, reddit)"
    echo "  full      - All servers enabled"
    echo ""
}

merge_configs() {
    local optional_config=$1

    # Backup current config
    cp "$BASE_CONFIG" "$BACKUP_CONFIG"

    # Merge using jq
    jq -s '.[0].mcpServers * .[1].mcpServers | {mcpServers: .}' \
        "$BASE_CONFIG" "$optional_config" > "$BASE_CONFIG.tmp"
    mv "$BASE_CONFIG.tmp" "$BASE_CONFIG"

    echo "Enabled profile: $PROFILE"
}

restore_core() {
    # Keep only core servers
    jq '.mcpServers |= with_entries(select(.key == "filesystem" or .key == "github" or .key == "postgres" or .key == "serena" or .key == "sequential-thinking"))' \
        "$BASE_CONFIG" > "$BASE_CONFIG.tmp"
    mv "$BASE_CONFIG.tmp" "$BASE_CONFIG"

    echo "Restored to core configuration"
}

case "$ACTION" in
    status)
        show_status
        show_profiles
        ;;
    list)
        show_profiles
        ;;
    enable)
        if [ -z "$PROFILE" ]; then
            echo "Error: Profile required for enable action"
            show_profiles
            exit 1
        fi

        case "$PROFILE" in
            docs) merge_configs ".mcp.optional-docs.json" ;;
            database) merge_configs ".mcp.optional-database.json" ;;
            testing) merge_configs ".mcp.optional-testing.json" ;;
            research) merge_configs ".mcp.optional-research.json" ;;
            full) cp ".mcp.json.backup-full" "$BASE_CONFIG"; echo "Enabled all servers" ;;
            *) echo "Unknown profile: $PROFILE"; show_profiles; exit 1 ;;
        esac

        echo -e "\nRESTART Claude Code for changes to take effect!"
        show_status
        ;;
    disable)
        restore_core
        echo -e "\nRESTART Claude Code for changes to take effect!"
        show_status
        ;;
    *)
        echo "Usage: $0 [enable|disable|status|list] [profile]"
        show_profiles
        exit 1
        ;;
esac
