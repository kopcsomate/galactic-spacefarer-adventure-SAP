# Galactic Spacefarer Adventure

A full-stack SAP CAP application with an SAP Fiori Elements frontend for managing spacefarers across multiple planets.

## Tech Stack

- SAP Cloud Application Programming Model (CAP)
- Node.js
- CDS
- OData V4
- SAP Fiori Elements / SAPUI5
- SQLite

## What Is It?

Galactic Spacefarer Adventure is a small space-themed management application built with SAP CAP and Fiori Elements.

Users can manage Spacefarers belonging to their assigned planet, while the backend handles authorization, progression, achievements and missions.

The application uses a standard CAP architecture:

- `db/` – domain model and seed data
- `srv/` – OData service, authorization and business logic
- `app/` – Fiori Elements frontend and UI annotations

## Features

- **Spacefarer Data Model** – Stardust, Navigation Skill, Origin Planet, Spacesuit Color and associations to Departments and Positions
- **Spacefarer CRUD** – create, read, update and delete Spacefarers through the CAP OData service
- **Protected CAP Service** – role-based authorization and planet-level data isolation
- **CAP Event Handlers** – before-create validation/progression calculation and after-create welcome notification
- **Fiori List Report** – Spacefarer overview with Stardust Status, Spacesuit Color, sorting, filtering and server-side pagination
- **Fiori Object Page** – detailed Spacefarer view with editable Stardust Collection and Spacesuit Color
- **Draft Support** – standard Fiori draft-based create and edit flows
- **Value Helps** – selectable Planet, Department, Position and Mission values
- **Stardust Progression** – automatic Rookie → Explorer → Voyager → Galactic Elite progression
- **Navigation Progression** – XP-based Wormhole Navigation Skill
- **Missions** – timed missions with Navigation XP rewards
- **Mission Validation** – rewards cannot be claimed early or more than once
- **Achievements** – 10 automatically evaluated achievements with progress tracking
- **Notifications** – simulated welcome email adapter for local development
- **OData Side Effects** – affected UI data refreshes automatically after mission actions


## How to Test

### 1. Start the Application

Install dependencies:

    npm install

Start CAP:

    cds watch

The development server runs by default at:

`http://localhost:4004`

Open the Fiori application from the CAP development launch page.

### 2. Test Users

| Username | Password | Role | Planet |
|---|---|---|---|
| `x-manager` | `x-manager` | SpacefarerManager | Planet X |
| `y-manager` | `y-manager` | SpacefarerManager | Planet Y |
| `x-viewer` | `x-viewer` | SpacefarerViewer | Planet X |

### 3. UI Testing

Log in as `x-manager`.

The user can:

- view Planet X Spacefarers
- create, edit and delete Spacefarers
- start missions
- claim completed mission rewards

Planet Y Spacefarers are not visible.

To easily test another user, open the application in a separate private/incognito browser window and log in as `y-manager`.

The `y-manager` user sees Planet Y Spacefarers instead of Planet X records.

Log in as `x-viewer` to verify read-only access.

Useful UI flows to test:

- Create → Edit → Delete Spacefarer
- Planet / Department / Position value helps
- Start Mission → wait for completion → Claim Reward
- Stardust and Navigation progression
- Achievement unlocking
- Planet-level data isolation

### 4. API Testing

The OData V4 service is available at:

`http://localhost:4004/odata/v4/galactic-spacefarer/`

#### Authenticate as Planet X Manager

    $pair = "x-manager:x-manager"

    $encoded = [Convert]::ToBase64String(
        [Text.Encoding]::ASCII.GetBytes($pair)
    )

    $xManagerHeaders = @{
        Authorization = "Basic $encoded"
    }

#### GET Spacefarers

    Invoke-RestMethod `
        -Uri "http://localhost:4004/odata/v4/galactic-spacefarer/Spacefarers" `
        -Headers $xManagerHeaders

Only Spacefarers belonging to Planet X should be returned.

#### POST Spacefarer

    $body = @{
        firstName = "Nova"
        lastName = "Stellar"
        email = "nova.stellar@example.com"
        stardustCollection = 320
        spacesuitColor = "Blue"
        originPlanet_ID = "10000000-0000-0000-0000-000000000003"
        department_ID = "20000000-0000-0000-0000-000000000001"
        position_ID = "30000000-0000-0000-0000-000000000001"
    } | ConvertTo-Json

    Invoke-RestMethod `
        -Method Post `
        -Uri "http://localhost:4004/odata/v4/galactic-spacefarer/Spacefarers" `
        -Headers $xManagerHeaders `
        -ContentType "application/json" `
        -Body $body

The backend calculates the derived progression values and triggers the mocked welcome notification.

#### Test Viewer Authorization

    $pair = "x-viewer:x-viewer"

    $encoded = [Convert]::ToBase64String(
        [Text.Encoding]::ASCII.GetBytes($pair)
    )

    $xViewerHeaders = @{
        Authorization = "Basic $encoded"
    }

A GET request is allowed:

    Invoke-RestMethod `
        -Uri "http://localhost:4004/odata/v4/galactic-spacefarer/Spacefarers" `
        -Headers $xViewerHeaders

Create, update and delete operations are rejected for the Viewer role.

#### Test Planet Isolation

Authenticate as `y-manager`:

    $pair = "y-manager:y-manager"

    $encoded = [Convert]::ToBase64String(
        [Text.Encoding]::ASCII.GetBytes($pair)
    )

    $yManagerHeaders = @{
        Authorization = "Basic $encoded"
    }

Retrieve a Planet Y Spacefarer:

    $yResponse = Invoke-RestMethod `
        -Uri "http://localhost:4004/odata/v4/galactic-spacefarer/Spacefarers" `
        -Headers $yManagerHeaders

    $ySpacefarerId = $yResponse.value[0].ID

Try to access the same record as `x-manager`:

    Invoke-RestMethod `
        -Uri "http://localhost:4004/odata/v4/galactic-spacefarer/Spacefarers(ID=$ySpacefarerId,IsActiveEntity=true)" `
        -Headers $xManagerHeaders

Expected result:

`404 Not Found`

This verifies that planet-level authorization is enforced by the CAP backend and not only by the Fiori UI.

##Other information

### Achievements

1. **First Launch** – Join the Galactic Spacefarer Adventure
2. **Stardust Collector** – Reach 250 Stardust
3. **Galactic Elite** – Reach 1000 Stardust
4. **Wormhole Rookie** – Earn 100 Navigation XP
5. **Wormhole Master** – Earn 1000 Navigation XP
6. **First Mission** – Complete the first mission
7. **Veteran Explorer** – Complete five missions
8. **Mission Specialist** – Complete three different mission types
9. **Cosmic Veteran** – Reach 500 Stardust and Navigation Skill 75
10. **ALDI Astronaut** – Unlock every other achievement

### Stardust

- `0–99` → Rookie
- `100–499` → Explorer
- `500–999` → Voyager
- `1000+` → Galactic Elite

### Navigation Skill

- `0–99 XP` → 10
- `100–249 XP` → 25
- `250–499 XP` → 50
- `500–999 XP` → 75
- `1000+ XP` → 100