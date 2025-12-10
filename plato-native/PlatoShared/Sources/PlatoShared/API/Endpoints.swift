import Foundation

/// API endpoint definitions
public enum APIEndpoint {
    // Authentication
    case login
    case logout
    case register
    case session
    case resetPassword
    case changePassword
    
    // MFA
    case mfaChallenge
    case mfaDevices
    case mfaTotpSetup
    case mfaTotpVerify
    case mfaEmailSendCode
    
    // Recipes
    case recipes
    case recipe(id: String)
    case recipeBulk
    case recipeBulkDelete
    
    // Ingredients
    case ingredients
    case ingredient(id: String)
    case ingredientBulk
    case ingredientBulkDelete
    
    // Categories
    case categories
    case categoryBulkDelete
    
    // Suppliers
    case suppliers
    case supplier(id: String)
    case supplierBulkDelete
    
    // Staff
    case staff
    case staffMember(id: String)
    case staffProfiles
    case staffShifts
    case staffTimesheets
    
    // Wholesale
    case wholesaleCustomers
    case wholesaleCustomer(id: String)
    case wholesaleOrders
    case wholesaleOrder(id: String)
    case wholesaleProducts
    case wholesaleProduct(id: String)
    case wholesalePurchaseOrders
    case wholesalePurchaseOrder(id: String)
    
    // Production
    case productionPlans
    case productionPlan(id: String)
    case productionItems
    case productionItem(id: String)
    case productionAssignments
    case productionShoppingList(id: String)
    
    // Analytics
    case analyticsForecasting
    case analyticsProfitability
    case analyticsTrends
    case analyticsSalesForecast
    case analyticsReportsGenerate
    case analyticsReportsExport
    
    // Team
    case teamMembers
    case teamInvite
    case teamInvitation
    case teamAccept
    case teamPin
    case teamSeats
    
    // User
    case userPreferences
    case userApps
    case userAppPreferences
    case userNavigationPreferences
    case userTimerPreferences
    
    // Company
    case companyUpdate
    case companyLogo
    
    // Inventory
    case inventory
    case inventoryItem(id: String)
    
    // Search
    case search
    
    var path: String {
        switch self {
        // Authentication
        case .login: return "/api/login"
        case .logout: return "/api/logout"
        case .register: return "/api/register"
        case .session: return "/api/session"
        case .resetPassword: return "/api/auth/reset-password"
        case .changePassword: return "/api/auth/change-password"
        
        // MFA
        case .mfaChallenge: return "/api/auth/mfa/challenge"
        case .mfaDevices: return "/api/auth/mfa/devices"
        case .mfaTotpSetup: return "/api/auth/mfa/totp/setup"
        case .mfaTotpVerify: return "/api/auth/mfa/totp/verify"
        case .mfaEmailSendCode: return "/api/auth/mfa/email/send-code"
        
        // Recipes
        case .recipes: return "/api/recipes_backup"
        case .recipe(let id): return "/api/recipes_backup/\(id)"
        case .recipeBulk: return "/api/recipes_backup/bulk"
        case .recipeBulkDelete: return "/api/recipes_backup/bulk-delete"
        
        // Ingredients
        case .ingredients: return "/api/ingredients"
        case .ingredient(let id): return "/api/ingredients/\(id)"
        case .ingredientBulk: return "/api/ingredients/bulk"
        case .ingredientBulkDelete: return "/api/ingredients/bulk-delete"
        
        // Categories
        case .categories: return "/api/categories"
        case .categoryBulkDelete: return "/api/categories/bulk-delete"
        
        // Suppliers
        case .suppliers: return "/api/suppliers"
        case .supplier(let id): return "/api/suppliers/\(id)"
        case .supplierBulkDelete: return "/api/suppliers/bulk-delete"
        
        // Staff
        case .staff: return "/api/staff"
        case .staffMember(let id): return "/api/staff/\(id)"
        case .staffProfiles: return "/api/staff/profiles"
        case .staffShifts: return "/api/staff/shifts"
        case .staffTimesheets: return "/api/staff/timesheets"
        
        // Wholesale
        case .wholesaleCustomers: return "/api/wholesale/customers"
        case .wholesaleCustomer(let id): return "/api/wholesale/customers/\(id)"
        case .wholesaleOrders: return "/api/wholesale/orders"
        case .wholesaleOrder(let id): return "/api/wholesale/orders/\(id)"
        case .wholesaleProducts: return "/api/wholesale/products"
        case .wholesaleProduct(let id): return "/api/wholesale/products/\(id)"
        case .wholesalePurchaseOrders: return "/api/wholesale/purchase-orders"
        case .wholesalePurchaseOrder(let id): return "/api/wholesale/purchase-orders/\(id)"
        
        // Production
        case .productionPlans: return "/api/production/plans"
        case .productionPlan(let id): return "/api/production/plans/\(id)"
        case .productionItems: return "/api/production/items"
        case .productionItem(let id): return "/api/production/items/\(id)"
        case .productionAssignments: return "/api/production/assignments"
        case .productionShoppingList(let id): return "/api/production/shopping-list/\(id)"
        
        // Analytics
        case .analyticsForecasting: return "/api/analytics/forecasting"
        case .analyticsProfitability: return "/api/analytics/profitability"
        case .analyticsTrends: return "/api/analytics/trends"
        case .analyticsSalesForecast: return "/api/analytics/sales-forecast"
        case .analyticsReportsGenerate: return "/api/analytics/reports/generate"
        case .analyticsReportsExport: return "/api/analytics/reports/export"
        
        // Team
        case .teamMembers: return "/api/team/members"
        case .teamInvite: return "/api/team/invite"
        case .teamInvitation: return "/api/team/invitation"
        case .teamAccept: return "/api/team/accept"
        case .teamPin: return "/api/team/pin"
        case .teamSeats: return "/api/team/seats"
        
        // User
        case .userPreferences: return "/api/user/preferences"
        case .userApps: return "/api/user/apps"
        case .userAppPreferences: return "/api/user/app-preferences"
        case .userNavigationPreferences: return "/api/user/navigation-preferences"
        case .userTimerPreferences: return "/api/user/timer-preferences"
        
        // Company
        case .companyUpdate: return "/api/company/update"
        case .companyLogo: return "/api/company/logo"
        
        // Inventory
        case .inventory: return "/api/inventory"
        case .inventoryItem(let id): return "/api/inventory/\(id)"
        
        // Search
        case .search: return "/api/search"
        }
    }
}





