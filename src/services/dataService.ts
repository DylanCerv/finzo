interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  priceHistory: {
    price: number;
    date: string;
  }[];
}

interface Sale {
  id: number;
  productId: number;
  quantity: number;
  total: number;
  date: string;
  productName: string;
  title?: string;
  unitPrice?: number;
  group_id?: string;
}

interface DataStore {
  products: Product[];
  sales: Sale[];
}

class DataService {
  private fileHandle: FileSystemFileHandle | null = null;
  private data: DataStore = { products: [], sales: [] };

  async initialize() {
    try {
      const savedData = localStorage.getItem('contabilidad_data');
      if (savedData) {
        this.data = JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  private async selectFile(forceNew: boolean = false) {
    try {
      const options = {
        types: [{
          description: 'Archivos JSON',
          accept: { 'application/json': ['.json'] }
        }]
      };

      if (forceNew) {
        // @ts-ignore
        this.fileHandle = await window.showSaveFilePicker(options);
      } else {
        try {
          // @ts-ignore
          const [fileHandle] = await window.showOpenFilePicker(options);
          this.fileHandle = fileHandle;
        } catch (error) {
          // Si no se selecciona un archivo existente, crear uno nuevo
          // @ts-ignore
          this.fileHandle = await window.showSaveFilePicker(options);
        }
      }

      // Intentar leer el archivo si existe
      try {
        if (this.fileHandle) {
          const file = await this.fileHandle.getFile();
          const content = await file.text();
          this.data = JSON.parse(content);
          await this.saveToLocalStorage();
        }
      } catch (error) {
        // Si el archivo no existe o está vacío, guardar los datos actuales
        await this.saveToFile();
      }
    } catch (error) {
      console.error('Error al seleccionar archivo:', error);
      throw error;
    }
  }

  private async saveToFile() {
    if (!this.fileHandle) return;

    try {
      const writable = await this.fileHandle.createWritable();
      await writable.write(JSON.stringify(this.data, null, 2));
      await writable.close();
      await this.saveToLocalStorage();
    } catch (error) {
      console.error('Error guardando archivo:', error);
      await this.saveToLocalStorage();
    }
  }

  private async saveToLocalStorage() {
    localStorage.setItem('contabilidad_data', JSON.stringify(this.data));
  }

  async getProducts(): Promise<Product[]> {
    return this.data.products;
  }

  async saveProducts(products: Product[]): Promise<void> {
    this.data.products = products;
    await this.saveToLocalStorage();
    if (this.fileHandle) {
      await this.saveToFile();
    }
  }

  async getSales(): Promise<Sale[]> {
    return this.data.sales;
  }

  async saveSales(sales: Sale[]): Promise<void> {
    this.data.sales = sales;
    await this.saveToLocalStorage();
    if (this.fileHandle) {
      await this.saveToFile();
    }
  }

  async getDailySales(date: string): Promise<Sale[]> {
    return this.data.sales.filter(sale => sale.date.startsWith(date));
  }

  async getWeeklySales(startDate: string, endDate: string): Promise<Sale[]> {
    return this.data.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return saleDate >= start && saleDate <= end;
    });
  }

  async exportData(): Promise<void> {
    try {
      await this.selectFile(true);
      if (this.fileHandle) {
        await this.saveToFile();
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }

  async importData(): Promise<void> {
    try {
      await this.selectFile(false);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  }

  async updateProductPrice(productId: number, newPrice: number): Promise<void> {
    const product = this.data.products.find(p => p.id === productId);
    if (product) {
      const oldPrice = product.price;
      product.price = newPrice;
      
      // Add price change to history
      if (!product.priceHistory) {
        product.priceHistory = [];
      }
      product.priceHistory.push({
        price: oldPrice,
        date: new Date().toISOString()
      });
      
      await this.saveProducts(this.data.products);
    }
  }

  async updateProductStock(productId: number, newStock: number): Promise<void> {
    const product = this.data.products.find(p => p.id === productId);
    if (product) {
      product.stock = newStock;
      await this.saveProducts(this.data.products);
    }
  }
}

export const dataService = new DataService();
dataService.initialize(); 