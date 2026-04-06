// Team Tool - Multi-agent collaboration system
import { z } from 'zod'
import { BaseTool, type ToolContext, type ToolResult } from '@/types/tool'

// Message types
export interface TeamMessage {
  id: string
  from: string
  to: string
  content: string
  timestamp: number
  type: 'direct' | 'broadcast' | 'reply'
  replyTo?: string
}

// Team/Agent group
export interface Team {
  id: string
  name: string
  description: string
  members: string[]  // Agent names
  createdAt: number
  leader?: string  // Lead agent name
}

// In-memory stores
const teamStore: Map<string, Team> = new Map()
const messageStore: Map<string, TeamMessage[]> = new Map()
let teamCounter = 0

// Generate unique IDs
function generateTeamId(): string {
  teamCounter++
  return `team_${Date.now()}_${teamCounter}`
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

// Schemas
export const TeamCreateInputSchema = z.object({
  name: z.string().describe('Team name'),
  description: z.string().optional().describe('Team description'),
  members: z.array(z.string()).min(1).describe('Initial team members (agent names)'),
  leader: z.string().optional().describe('Lead agent name')
})

export const TeamDeleteInputSchema = z.object({
  teamId: z.string().describe('Team ID to delete')
})

export const TeamSendMessageInputSchema = z.object({
  teamId: z.string().describe('Team ID to send message to'),
  to: z.string().describe('Recipient agent name (or "all" for broadcast)'),
  content: z.string().describe('Message content'),
  type: z.enum(['direct', 'broadcast', 'reply']).describe('Message type'),
  replyTo: z.string().optional().describe('Message ID to reply to')
})

export const TeamListInputSchema = z.object({
  agentName: z.string().optional().describe('Filter teams by member')
})

export const TeamInfoInputSchema = z.object({
  teamId: z.string().describe('Team ID')
})

export const TeamAddMemberInputSchema = z.object({
  teamId: z.string().describe('Team ID'),
  agentName: z.string().describe('Agent name to add')
})

export const TeamRemoveMemberInputSchema = z.object({
  teamId: z.string().describe('Team ID'),
  agentName: z.string().describe('Agent name to remove')
})

export const TeamGetMessagesInputSchema = z.object({
  teamId: z.string().describe('Team ID'),
  agentName: z.string().optional().describe('Filter messages for specific agent'),
  limit: z.number().describe('Max messages to return')
})

export type TeamCreateInput = z.infer<typeof TeamCreateInputSchema>
export type TeamDeleteInput = z.infer<typeof TeamDeleteInputSchema>
export type TeamSendMessageInput = z.infer<typeof TeamSendMessageInputSchema>
export type TeamListInput = z.infer<typeof TeamListInputSchema>
export type TeamInfoInput = z.infer<typeof TeamInfoInputSchema>
export type TeamAddMemberInput = z.infer<typeof TeamAddMemberInputSchema>
export type TeamRemoveMemberInput = z.infer<typeof TeamRemoveMemberInputSchema>
export type TeamGetMessagesInput = z.infer<typeof TeamGetMessagesInputSchema>

// TeamCreate Tool
export class TeamCreateTool extends BaseTool<TeamCreateInput, Team> {
  readonly name = 'team_create'
  readonly description = 'Create a team of agents for collaborative work'
  readonly inputSchema = TeamCreateInputSchema

  async execute(context: ToolContext, input: TeamCreateInput): Promise<ToolResult<Team>> {
    const team: Team = {
      id: generateTeamId(),
      name: input.name,
      description: input.description ?? '',
      members: [...new Set([context.agent.name, ...input.members])],  // Always include creator
      createdAt: Date.now(),
      leader: input.leader
    }

    teamStore.set(team.id, team)
    messageStore.set(team.id, [])

    return {
      content: `Created team "${team.name}" (${team.id})\nMembers: ${team.members.join(', ')}${team.leader ? `\nLeader: ${team.leader}` : ''}`,
      data: team
    }
  }
}

// TeamDelete Tool
export class TeamDeleteTool extends BaseTool<TeamDeleteInput, boolean> {
  readonly name = 'team_delete'
  readonly description = 'Delete a team'
  readonly inputSchema = TeamDeleteInputSchema

  async execute(context: ToolContext, input: TeamDeleteInput): Promise<ToolResult<boolean>> {
    const team = teamStore.get(input.teamId)

    if (!team) {
      return {
        content: `Team not found: ${input.teamId}`,
        error: 'TEAM_NOT_FOUND'
      }
    }

    // Check if requester is leader or member
    if (team.leader && context.agent.name !== team.leader) {
      return {
        content: `Only team leader (${team.leader}) can delete the team`,
        error: 'PERMISSION_DENIED'
      }
    }

    teamStore.delete(input.teamId)
    messageStore.delete(input.teamId)

    return {
      content: `Deleted team "${team.name}" (${team.id})`,
      data: true
    }
  }
}

// TeamSendMessage Tool
export class TeamSendMessageTool extends BaseTool<TeamSendMessageInput, TeamMessage> {
  readonly name = 'team_sendmessage'
  readonly description = 'Send a message to a team member or broadcast to team'
  readonly inputSchema = TeamSendMessageInputSchema
  readonly aliases = ['teamsend', 'team_message']

  async execute(context: ToolContext, input: TeamSendMessageInput): Promise<ToolResult<TeamMessage>> {
    const team = teamStore.get(input.teamId)

    if (!team) {
      return {
        content: `Team not found: ${input.teamId}`,
        error: 'TEAM_NOT_FOUND'
      }
    }

    // Check if sender is member
    if (!team.members.includes(context.agent.name)) {
      return {
        content: `You are not a member of team "${team.name}"`,
        error: 'NOT_A_MEMBER'
      }
    }

    // Validate recipient for direct messages
    if (input.to !== 'all' && !team.members.includes(input.to)) {
      return {
        content: `Agent "${input.to}" is not a member of team "${team.name}"`,
        error: 'INVALID_RECIPIENT'
      }
    }

    const messageType = input.type || 'direct'
    const message: TeamMessage = {
      id: generateMessageId(),
      from: context.agent.name,
      to: input.to,
      content: input.content,
      timestamp: Date.now(),
      type: messageType as 'direct' | 'broadcast' | 'reply',
      replyTo: input.replyTo
    }

    // Store message
    const messages = messageStore.get(input.teamId) ?? []
    messages.push(message)
    messageStore.set(input.teamId, messages)

    const recipientDisplay = input.to === 'all' ? 'all members' : input.to
    const typeDisplay = messageType === 'broadcast' ? 'broadcast to' : 'sent to'

    return {
      content: `Message ${typeDisplay} ${recipientDisplay} in team "${team.name}"\n[${message.id}] ${context.agent.name}: ${input.content}`,
      data: message
    }
  }
}

// TeamList Tool
export class TeamListTool extends BaseTool<TeamListInput, Team[]> {
  readonly name = 'team_list'
  readonly description = 'List all teams, optionally filtered by agent membership'
  readonly inputSchema = TeamListInputSchema

  async execute(context: ToolContext, input: TeamListInput): Promise<ToolResult<Team[]>> {
    let teams = Array.from(teamStore.values())

    // Filter by agent membership
    if (input.agentName) {
      teams = teams.filter(t => t.members.includes(input.agentName!))
    }

    // Sort by creation date (newest first)
    teams.sort((a, b) => b.createdAt - a.createdAt)

    if (teams.length === 0) {
      return {
        content: 'No teams found',
        data: []
      }
    }

    const output = teams.map(t => {
      const leaderInfo = t.leader ? ` [Leader: ${t.leader}]` : ''
      return `${t.id}: ${t.name} - ${t.members.length} members${leaderInfo}`
    }).join('\n')

    return {
      content: `## Teams\n\n${output}`,
      data: teams
    }
  }
}

// TeamInfo Tool
export class TeamInfoTool extends BaseTool<TeamInfoInput, Team> {
  readonly name = 'team_info'
  readonly description = 'Get detailed information about a team'
  readonly inputSchema = TeamInfoInputSchema

  async execute(context: ToolContext, input: TeamInfoInput): Promise<ToolResult<Team>> {
    const team = teamStore.get(input.teamId)

    if (!team) {
      return {
        content: `Team not found: ${input.teamId}`,
        error: 'TEAM_NOT_FOUND'
      }
    }

    const memberList = team.members.map(m => {
      const isLeader = m === team.leader ? ' ⭐' : ''
      return `  - ${m}${isLeader}`
    }).join('\n')

    const messageCount = (messageStore.get(input.teamId) ?? []).length

    const output = [
      `Team: ${team.name}`,
      `ID: ${team.id}`,
      `Description: ${team.description || 'N/A'}`,
      `Leader: ${team.leader ?? 'None'}`,
      `Members (${team.members.length}):`,
      memberList,
      `Messages: ${messageCount}`,
      `Created: ${new Date(team.createdAt).toISOString()}`
    ].join('\n')

    return {
      content: output,
      data: team
    }
  }
}

// TeamAddMember Tool
export class TeamAddMemberTool extends BaseTool<TeamAddMemberInput, Team> {
  readonly name = 'team_addmember'
  readonly description = 'Add a member to a team'
  readonly inputSchema = TeamAddMemberInputSchema

  async execute(context: ToolContext, input: TeamAddMemberInput): Promise<ToolResult<Team>> {
    const team = teamStore.get(input.teamId)

    if (!team) {
      return {
        content: `Team not found: ${input.teamId}`,
        error: 'TEAM_NOT_FOUND'
      }
    }

    // Check permission (leader or any member can add)
    if (team.leader && context.agent.name !== team.leader && !team.members.includes(context.agent.name)) {
      return {
        content: `Only team leader or members can add new members`,
        error: 'PERMISSION_DENIED'
      }
    }

    if (team.members.includes(input.agentName)) {
      return {
        content: `Agent "${input.agentName}" is already a member of team "${team.name}"`,
        error: 'ALREADY_MEMBER'
      }
    }

    team.members.push(input.agentName)

    return {
      content: `Added "${input.agentName}" to team "${team.name}"\nMembers: ${team.members.join(', ')}`,
      data: team
    }
  }
}

// TeamRemoveMember Tool
export class TeamRemoveMemberTool extends BaseTool<TeamRemoveMemberInput, Team> {
  readonly name = 'team_removemember'
  readonly description = 'Remove a member from a team'
  readonly inputSchema = TeamRemoveMemberInputSchema

  async execute(context: ToolContext, input: TeamRemoveMemberInput): Promise<ToolResult<Team>> {
    const team = teamStore.get(input.teamId)

    if (!team) {
      return {
        content: `Team not found: ${input.teamId}`,
        error: 'TEAM_NOT_FOUND'
      }
    }

    // Only leader can remove members
    if (team.leader && context.agent.name !== team.leader) {
      return {
        content: `Only team leader (${team.leader}) can remove members`,
        error: 'PERMISSION_DENIED'
      }
    }

    if (!team.members.includes(input.agentName)) {
      return {
        content: `Agent "${input.agentName}" is not a member of team "${team.name}"`,
        error: 'NOT_A_MEMBER'
      }
    }

    // Can't remove the leader
    if (input.agentName === team.leader) {
      return {
        content: `Cannot remove team leader. Transfer leadership first.`,
        error: 'CANNOT_REMOVE_LEADER'
      }
    }

    team.members = team.members.filter(m => m !== input.agentName)

    return {
      content: `Removed "${input.agentName}" from team "${team.name}"\nMembers: ${team.members.join(', ')}`,
      data: team
    }
  }
}

// TeamGetMessages Tool
export class TeamGetMessagesTool extends BaseTool<TeamGetMessagesInput, TeamMessage[]> {
  readonly name = 'team_getmessages'
  readonly description = 'Get message history for a team'
  readonly inputSchema = TeamGetMessagesInputSchema

  async execute(context: ToolContext, input: TeamGetMessagesInput): Promise<ToolResult<TeamMessage[]>> {
    const team = teamStore.get(input.teamId)

    if (!team) {
      return {
        content: `Team not found: ${input.teamId}`,
        error: 'TEAM_NOT_FOUND'
      }
    }

    let messages = messageStore.get(input.teamId) ?? []
    const limit = input.limit ?? 50

    // Filter by agent if specified
    if (input.agentName) {
      messages = messages.filter(m => m.from === input.agentName || m.to === input.agentName || m.to === 'all')
    }

    // Sort by timestamp (newest first) and limit
    messages.sort((a, b) => b.timestamp - a.timestamp)
    messages = messages.slice(0, limit)

    if (messages.length === 0) {
      return {
        content: 'No messages found',
        data: []
      }
    }

    const output = messages.map(m => {
      const recipient = m.to === 'all' ? '→ [all]' : `→ ${m.to}`
      const replyInfo = m.replyTo ? ` (reply to ${m.replyTo})` : ''
      return `[${m.id}] ${m.timestamp}: ${m.from} ${recipient}${replyInfo}\n    ${m.content}`
    }).join('\n\n')

    return {
      content: `## Team Messages: ${team.name}\n\n${output}`,
      data: messages
    }
  }
}

// Export instances
export const teamCreateTool = new TeamCreateTool()
export const teamDeleteTool = new TeamDeleteTool()
export const teamSendMessageTool = new TeamSendMessageTool()
export const teamListTool = new TeamListTool()
export const teamInfoTool = new TeamInfoTool()
export const teamAddMemberTool = new TeamAddMemberTool()
export const teamRemoveMemberTool = new TeamRemoveMemberTool()
export const teamGetMessagesTool = new TeamGetMessagesTool()
