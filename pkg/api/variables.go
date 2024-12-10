package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/grafana/grafana/pkg/api/response"
	contextModel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/web"
)

type Variable struct {
	ID          string     `json:"id"`
	UID         string     `json:"uid"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Value       string     `json:"value"`
	Type        string     `json:"type"`
	Scope       string     `json:"scope"`
	ScopeID     string     `json:"scope_id"`
	Props       string     `json:"props"`
	CreatedBy   string     `json:"created_by"`
	CreatedAt   *time.Time `json:"created_at"`
	UpdatedBy   string     `json:"updated_by"`
	UpdatedAt   *time.Time `json:"updated_at"`
}

func (hs *HTTPServer) GetVariables(c *contextModel.ReqContext) response.Response {
	return response.JSON(http.StatusOK, hs.Variables)
}

func (hs *HTTPServer) CreateVariable(c *contextModel.ReqContext) response.Response {
	bodyBytes, err := io.ReadAll(c.Req.Body)
	if err != nil {
		return response.JSON(http.StatusInternalServerError, nil)
	}
	defer c.Req.Body.Close()
	now := time.Now().UTC()
	scope := "org"
	scopeId := fmt.Sprintf("%d", c.OrgID)
	if c.Req.URL.Query().Get("scope") != "" {
		scope = c.Req.URL.Query().Get("scope")
	}
	variable := Variable{
		UID:         uuid.New().String(),
		ID:          c.Req.URL.Query().Get("id"),
		Name:        c.Req.URL.Query().Get("name"),
		Description: c.Req.URL.Query().Get("description"),
		Value:       c.Req.URL.Query().Get("value"),
		Type:        c.Req.URL.Query().Get("type"),
		Scope:       scope,
		ScopeID:     scopeId,
		CreatedBy:   c.UserUID,
		CreatedAt:   &now,
		Props:       string(bodyBytes),
	}
	hs.Variables = append(hs.Variables, variable)
	return response.JSON(http.StatusOK, variable)
}

func (hs *HTTPServer) UpdateVariable(c *contextModel.ReqContext) response.Response {
	now := time.Now().UTC()
	uid := web.Params(c.Req)[":uid"]
	variables := []Variable{}
	for _, v := range hs.Variables {
		variable := v
		if v.UID == uid {
			if err := json.NewDecoder(c.Req.Body).Decode(&variable); err == nil {
				variable.UpdatedAt = &now
				variable.UpdatedBy = c.UserUID
				variable.UID = uid
			}
		}
		variables = append(variables, variable)
	}
	hs.Variables = variables
	return response.JSON(http.StatusOK, map[string]any{"status": "updated", "uid": uid})
}

func (hs *HTTPServer) DeleteVariableByUID(c *contextModel.ReqContext) response.Response {
	// variables := []Variable{}
	uid := web.Params(c.Req)[":uid"]
	for index, v := range hs.Variables {
		hs.log.Error("UID", "LOOP", v.UID, "path", uid)
		if strings.EqualFold(strings.TrimSpace(v.UID), strings.TrimSpace(uid)) {
			hs.log.Error("FOUND")
			hs.Variables = append(hs.Variables[:index], hs.Variables[index+1:]...)
		}
	}
	// hs.Variables = variables
	return response.JSON(http.StatusOK, map[string]any{"status": "deleted", "uid": uid})
}
